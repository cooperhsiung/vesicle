/**
 * Created by Cooper on 2019/08/31.
 */
import fs from 'fs';
import os from 'os';
import _ from 'lodash';
import path from 'path';
import net, { Socket } from 'net';

import * as internal from './internal';
import { decode, encode, localIp, reform, request } from './helper';
import { Middleware, compose } from './middleware';

export type ServerOptions = {
  nodeID?: string;
  port?: number;
};

export interface Node {
  name: string;
  addr: string;
  health?: boolean;
}

export type Handler = (parameter?: any) => any;

// constructor
// export class Action {
//   public name: string;
//   public handler: Handler;
//   public version?: string;
//   public use?: any[];
//
//   constructor(name: string, handler: Handler) {
//     this.name = name;
//     this.handler = handler;
//   }
// }

export type Action = {
  name: string;
  handler: Handler;
  version?: string;
  use?: Middleware | Middleware[];
};

// -----
// action1 node1.health
// action2 book.list
// action3 book.v2.list

// todo
//
// -1. health check
// -2. 缓存上一次的 nodes
// -3. async handler
// 4. rename
// -5. healthy from client, send beat
// 6. clean code
// -7. decorator
// -8. serilize
// 9. middleware
// 10. performance
// 11. plugin

export class Server {
  public nodeID: string;
  private port: number;
  public localAddr!: string;
  public nodes: Node[];

  public connectionMap: { [addr: string]: Socket } = {};
  public actionMap: { [name: string]: Action } = {};

  public socket: net.Server;
  private timeout: number = 5000;

  private heartbeatInterval: number = 10000;

  constructor(options: ServerOptions = {}) {
    this.nodeID = options.nodeID || os.hostname();
    this.port = 3000;
    this.nodes = [];

    this.loadModule(internal);

    this.socket = net.createServer(sock => {
      let buf = new Buffer(0);
      this.addConnection(sock);

      sock.setNoDelay();
      sock.on('data', async data => {
        if (buf.length === 0) {
          buf = data;
        } else {
          buf = Buffer.concat([buf, data]);
        }

        while (buf.length > 4) {
          const packetLength = 4 + buf.readUInt32BE(0);

          if (buf.length >= packetLength) {
            const body = buf.slice(0, packetLength);

            const { A: actionName, P: payload, I: id } = decode(body);

            const action = this.actionMap[reform(actionName, this.nodeID)];

            let success = 0;
            let data: any = 'Action Not Found';
            try {
              if (action) {
                data = await action.handler(payload);
                success = 1;
              }
            } catch (e) {
              data = e.message;
            }

            const newPacket = {
              I: id, // id
              S: success, // result ok
              A: actionName,
              F: this.localAddr,
              P: data
            };

            sock.write(encode(newPacket));

            buf = buf.slice(packetLength);
          } else {
            break;
          }
        }
      });

      sock.on('close', () => {
        // console.log('CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort); // debug open
        this.delConnection(sock);
      });

      sock.on('error', err => {
        // reset error // need
        console.error(
          `[${new Date().toISOString()}]`,
          err.message,
          sock.remoteAddress + ':' + sock.remotePort
        );
        // console.log('CLOSED: ' + sock.remoteAddress +' '+ sock.remotePort);
        this.delConnection(sock);
      });
    });

    this.socket.on('error', err => {
      // cant catch some error
      console.log(`[${new Date().toISOString()}]`, 'tcp server', err);
    });

    this.socket.on('connection', c => {
      // console.log(c,"=====")
    });

    this.socket.on('listening', () => {
      this.localAddr = localIp + ':' + this.port;
      console.log(
        `[${new Date().toISOString()}]`,
        'nodeID',
        this.nodeID,
        this.localAddr
      );
      this.nodes = [{ name: this.nodeID, addr: this.localAddr, health: true }];
      try {
        const cacheFile = path.resolve(__dirname, 'bin', this.nodeID + '.json');
        const ok = fs.existsSync(cacheFile);
        if (ok) {
          const data = fs.readFileSync(cacheFile, 'utf-8');
          const cache = JSON.parse(data);
          this.nodes = _.uniqBy(_.concat(this.nodes, cache.nodes), 'addr');
        }
      } catch (e) {
        console.error(`[${new Date().toISOString()}]`, e, '4444');
      }
      setTimeout(() => {
        this.startTimer();
      }, 1000);
    });
  } // contructor end

  private delConnection(sock: Socket) {
    setTimeout(() => {
      delete this.connectionMap[`${sock.remoteAddress}:${sock.remotePort}`];
    }, 30000);
  }

  private addConnection(sock: Socket) {
    this.connectionMap[`${sock.remoteAddress}:${sock.remotePort}`] = sock;
  }

  private startTimer() {
    // heartbeat
    setInterval(() => {
      console.log(`[${new Date().toISOString()}]`, 'heartbeat', this.nodes);
      // detect the other side
      this.nodes
        .filter(e => e.addr !== this.localAddr)
        .forEach(node => {
          request(`${node.addr}/heartbeat`, {
            from: this.localAddr,
            to: node.addr
          })
            .then(() => {
              if (node.health === false) {
                node.health = true;
                internal.sync.call(this, this.nodes);
              }
              node.health = true;
            })
            .catch(() => {
              if (node.health === true) {
                node.health = false;
                internal.sync.call(this, this.nodes);
              }
              node.health = false;
            });
        });
    }, this.heartbeatInterval);
  }

  addAction(action: Action): boolean;
  addAction(handle: Handler, service?: string, version?: string): boolean;
  addAction(
    action: Action | Handler,
    service?: string,
    version?: string
  ): boolean {
    //
    if (typeof action === 'function') {
      if (!action.name) {
        console.error('anonymous function is not allowed:', arguments);
        return false;
      }
      action = {
        name: service ? service + '.' + action.name : action.name,
        handler: action.bind(this),
        version: version
      };
    }

    if (action.use) {
      if (!Array.isArray(action.use)) {
        action.use = [action.use];
      }
      action.handler = compose(
        action.handler,
        { action },
        action.use
      );
    }

    const actionName = reform(action.name, this.nodeID, action.version);
    if (this.actionMap[actionName]) {
      console.log(
        `[${new Date().toISOString()}]`,
        `action ${actionName} already exists`
      );
      return false;
    }
    this.actionMap[actionName] = action;
    return true;
  }

  addActions(actions: Action[]) {
    actions.forEach(action => this.addAction(action));
  }

  loadModule(
    module: { [key: string]: Handler },
    service?: string,
    version?: string
  ) {
    Object.values(module).forEach(fn => {
      this.addAction(fn, service, version);
    });
  }

  listen(port: number) {
    this.port = port;
    this.socket.listen(port, '0.0.0.0');
    console.log(`[${new Date().toISOString()}]`, 'Listening on', port, '..');
  }
}
