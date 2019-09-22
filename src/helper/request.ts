import net, { Socket } from 'net';
import { uuid } from './uuid';
import { decode, encode } from './parser';

// volatile client
class SimpleClient {
  private url: string;
  private payload: any;
  private client!: Socket;
  private addr: string;
  private action: string;
  constructor(url: string, payload?: any) {
    this.url = url;
    this.payload = payload;
    [this.addr, this.action] = this.url.split('/');
    if (!this.addr || !this.action) {
      throw new Error('url is not valid');
    }
  }

  connect(): Promise<any> {
    return new Promise((resolve, reject) => {
      const [host, port] = this.addr.split(':');
      this.client = net.createConnection({ host, port: Number(port) });
      this.client.setNoDelay();

      const timer = setTimeout(reject, 3000, 'connect timeout');

      this.client.on('connect', () => {
        clearTimeout(timer);
        resolve();
      });

      this.client.on('error', err => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  send() {
    const body = {
      I: uuid(),
      S: 1,
      F: `${this.client.localAddress}:${this.client.localPort}`,
      A: this.action,
      P: this.payload
    };
    this.client.write(encode(body));
  }

  response(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.send();
      let buf = new Buffer(0);
      const timer = setTimeout(reject, 10000, 'response timeout');
      this.client.on('data', data => {
        if (buf.length === 0) {
          buf = data;
        } else {
          buf = Buffer.concat([buf, data]);
        }
        if (buf.length > 4) {
          const packetLength = 4 + buf.readUInt32BE(0);
          if (buf.length >= packetLength) {
            const body = buf.slice(0, packetLength);
            const packet = decode(body);
            clearTimeout(timer);
            resolve(packet.P);
          }
        }
      });

      this.client.on('error', err => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  destroy() {
    this.client.destroy();
  }

  async fetch() {
    await this.connect();
    const data = await this.response();
    this.destroy();
    return data;
  }
}

/*
 * @url '127.0.0.1:1231/book.list'
 * @payload ...
 * */
export function request(url: string, payload?: any) {
  const client = new SimpleClient(url, payload);
  return client.fetch();
}

// request('172.30.4.80:6960/nodes')
//   .then(ret => {
//     console.log(ret);
//   })
//   .catch(err => {
//     console.error(err);
//   });
