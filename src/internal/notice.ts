import fs from 'fs';
import _ from 'lodash';
import path from 'path';
import { Node, Server } from '../server';
import { encode, request, uuid } from '../helper';

// concat remote nodes to local
export async function join(this: Server, payload: Node) {
  try {
    const remoteNodes = await request(`${payload.addr}/nodes`);
    this.nodes = _.uniqBy(_.concat(this.nodes, remoteNodes), 'addr');
    for (const node of this.nodes) {
      console.log('========= this.nodeID', this.nodeID, this.nodes);
      request(`${node.addr}/sync`, this.nodes).catch(err => {
        console.error('sync', err);
      });
    }
  } catch (e) {
    console.error(e);
    console.log('join failed', JSON.stringify(payload));
  }
}

// receive a sync notice
export async function sync(this: Server, payload: Node[]) {
  try {
    console.log('========= start sync', this.localAddr);
    this.nodes = payload;
    const cache = JSON.stringify({
      nodes: this.nodes,
      version: Date.now()
    });
    fs.writeFile(
      path.resolve(__dirname, '../bin', this.nodeID + '.json'),
      cache,
      err => {
        if (err) {
          console.log(err);
        }
      }
    );
    // notify connected client, update nodes
    Object.values(this.connectionMap).forEach(sock => {
      if (!sock.destroyed) {
        // some internal request
        const body = {
          I: uuid(),
          S: 1,
          A: 'sync',
          P: payload,
          F: this.localAddr
        };
        sock.write(encode(body));
      }
    });
  } catch (e) {
    console.log('sync error', e);
  }
}

// receive heartbeat
export function heartbeat(this: Server, payload: { from: string; to: string }) {
  const node = _.find(this.nodes, e => e.addr === payload.from);
  if (node) {
    if (node.health === false) {
      node.health = true;
      sync.call(this, this.nodes);
    }
    node.health = true;
  } else {
    request(`${this.localAddr}/join`, {
      addr: payload.from
    }).catch(err => {
      console.error('join', err);
    });
  }
}
