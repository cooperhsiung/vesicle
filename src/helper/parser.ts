//
// simple faster
// protocol
// |   4    | .... |
// | length | body |

const id = 'I';
const success = 'S';
const from = 'F';
const action = 'A';
const payload = 'P';

export type Packet = {
  [id]: string; // 32   id
  [success]: number; // success
  [from]: string; //    from
  [action]: string; //  action
  [payload]: any; //    payload
};

export function encode(packet: Packet) {
  const data = JSON.stringify(packet);
  const len = data.length;
  const buf = Buffer.alloc(4 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(data, 4, len);
  return buf;
}

export function decode(buffer: Buffer): Packet {
  return JSON.parse(buffer.slice(4).toString());
}
