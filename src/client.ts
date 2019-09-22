/**
 * Created by Cooper on 2019/08/31.
 */
import _ from 'lodash';
import net, { Socket } from 'net';

import { Node } from './server';

import { Provider, RoundRobin, Strategy } from './strategy';
import { request, uuid, Deferred, encode, decode } from './helper';

// todo
// -1 更新了的新的 node , server write to connected client
// -2 retry, round robin, from healthy node
// -3 update node ---
// -4 timeout performance
// -5 improve protocol
// -6 reject error
// -7 better log

type ClientOptions = {
  url: string;
  timeout?: number;
  retry?: number;
  connectTimeout?: number;
};

export type CallOptions = {
  retry?: number;
  version?: string;
  timeout?: number;
};

class Exception extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class Client {
  private url: string;
  private entryAddrs: string[];
  private retry: number = 3;
  private timeout: number;
  private connectTimeout: number;

  private nodes: Node[] = [];

  private connectionMap: { [addr: string]: Socket } = {};
  private pendingMap: { [id: string]: Deferred } = {};
  private providersMap: { [name: string]: Provider[] } = {};
  private strategyMap: { [name: string]: Strategy } = {};

  constructor(options: ClientOptions) {
    this.url = options.url; // checkurl
    this.entryAddrs = options.url.split(',');
    this.connectTimeout = options.connectTimeout || 3000;
    this.timeout = options.timeout || 20000; // call timeout
    this.retry = options.retry || 3;

    this.discover();
  }

  private async discover() {
    const data = await Promise.all(this.entryAddrs.map(e => getNodes(e)));
    this.nodes = _.uniqBy(_.flatten(data), 'addr');
  }

  private connect(addr: string): Promise<Socket> {
    const [host, port] = addr.split(':');
    const client = net.createConnection({ host, port: Number(port) });
    client.setNoDelay();

    let buf = new Buffer(0);

    client.on('data', data => {
      if (buf.length === 0) {
        buf = data;
      } else {
        buf = Buffer.concat([buf, data]);
      }

      while (buf.length > 4) {
        const packetLength = 4 + buf.readUInt32BE(0);

        if (buf.length >= packetLength) {
          const body = buf.slice(0, packetLength);

          const { A: action, P: payload, I: id, S: success } = decode(body);
          //
          if (action === 'sync') {
            console.log('========= sync', payload);
            this.nodes = payload;
            Object.keys(this.providersMap).forEach(k => this.lookup(k, true));
          } else {
            if (success) {
              this.pendingMap[id].resolve(payload);
            } else {
              this.pendingMap[id].reject(new Exception(payload));
            }
            clearTimeout(this.pendingMap[id].timer);
            delete this.pendingMap[id];
          }
          //
          buf = buf.slice(packetLength);
        } else {
          break;
        }
      }
    });

    return new Promise((resolve, reject) => {
      const timer = setTimeout(reject, this.connectTimeout, 'connect timeout');

      client.on('connect', () => {
        console.log(`[${new Date().toISOString()}]`, 'connected...');
        this.connectionMap[addr] = client;
        clearTimeout(timer);
        resolve(client);
      });

      client.on('error', err => {
        console.error(`[${new Date().toISOString()}]`, 'connect error', err);
        clearTimeout(timer);
        delete this.connectionMap[addr]; // check
        reject(err);
      });
    });
  }

  async call(
    action: string,
    parameter?: any,
    options: CallOptions = { retry: this.retry }
  ): Promise<any> {
    //
    const providers = await this.lookup(action);
    // filter health
    if (!providers) {
      this.lookup(action);
      throw new Error('no providers exist for ' + action);
    }

    const strategy = this.strategyMap[action];
    // console.log(strategy.targets);
    const provider = strategy.select(); // round robin, random
    // console.log('========= strategy', (strategy as any).counter);
    // console.log('========= provider', provider);
    try {
      return await this.request(provider.addr, action, parameter, options);
    } catch (e) {
      if (e instanceof Exception) {
        throw e;
      }
      // promise.reject will be catched
      console.error('===== request err', e);
      provider.fall++;
      options.retry!--;
      if (options.retry! > 0) {
        console.log('========= retry', options.retry);
        return this.call(action, parameter, options);
      } else {
        throw e;
      }
    }
  }

  private async lookup(
    action: string,
    force: boolean = false
  ): Promise<Provider[]> {
    if (this.providersMap[action] && !force) {
      return this.providersMap[action];
    }

    if (this.nodes.length === 0) {
      await this.discover();
    }

    console.log('========= this.nodes', this.nodes);
    const remoteNodes = _.shuffle(this.nodes.filter(e => e.health)); // healthy node
    const checkResult = await Promise.all(
      remoteNodes.map(e => checkAction(e.addr, action))
    );
    const result = checkResult.filter(e => e.existed).map(e => e.addr);
    if (result.length) {
      const providers = result.map(e => ({ addr: e, fall: 0 }));
      this.providersMap[action] = providers;
      this.strategyMap[action] = new RoundRobin(providers);
    }
    return this.providersMap[action];
  }

  private async request(
    addr: string,
    action: string,
    parameter?: any,
    options: CallOptions = {}
  ): Promise<any> {
    if (!this.connectionMap[addr]) {
      await this.connect(addr);
    }

    const sock = this.connectionMap[addr];
    const id = uuid();

    const packet = {
      I: id,
      S: 1,
      F: `${sock.localAddress}:${sock.localPort}`,
      A: action,
      P: parameter
    };

    this.pendingMap[id] = new Deferred(options.timeout || this.timeout);
    sock.write(encode(packet));
    return this.pendingMap[id].promise;
  }
}

async function checkAction(addr: string, action: string): Promise<any> {
  try {
    let data = await request(`${addr}/hasAction`, action);
    return { addr: addr, existed: data };
  } catch (e) {
    console.error(`[${new Date().toISOString()}]`, 'checkAction', e);
    return { addr: addr, existed: false };
  }
}

async function getNodes(addr: string): Promise<any> {
  try {
    return await request(`${addr}/nodes`);
  } catch (e) {
    console.error(`[${new Date().toISOString()}]`, 'getNodes', e);
    return [];
  }
}
