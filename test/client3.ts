import net from 'net';

// import { encode, decode } from '../parser';
import { uuid, request } from '../src/helper';

const host = '172.19.2.10';
// const host = '192.168.1.61';
const port = '6969';

console.log('start');
request(`${host}:6960/join`, { addr: host + ':6970' })
  .then(ret => {
    console.log(ret);
  })
  .catch(err => {
    console.error(err);
  });
/*

const client = net.createConnection({ host, port: Number(port) });
client.setNoDelay();

client.on('error', err => {
  console.error('connect error', err);
});

const id = uuid();

const body = {
  id: id,
  type: 1,
  action: 'hasAction',
  payload: {name:'asdasd'},
  from: ``,
  to: ``
};

client.write(encode(JSON.stringify(body)));

client.on('data',(d)=>{
  console.log(d);
  console.log(decode(d));
  client.destroy()
});*/
