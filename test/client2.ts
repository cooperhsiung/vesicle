import { request } from '../src/helper';

// send a simple request
request('192.168.1.61:6960/book.cache', 'hello')
  .then(ret => {
    console.log(ret);
  })
  .catch(err => {
    console.error(err);
  });
