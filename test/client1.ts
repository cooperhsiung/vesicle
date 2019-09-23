import { Client } from '../src/client';

const myclient = new Client({
  url: '172.19.2.10:6960,172.19.2.10:6971,192.168.1.61:6960,172.30.4.80:6960'
});

console.log('start');

myclient
  .call('book.hi')
  .then(ret => {
    console.log(ret, typeof ret);
  })
  .catch(err => {
    console.error(err, 'there');
  });
