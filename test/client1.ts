import { Client } from '../src/client';

// let myclient = new Client({ url: '192.168.1.61:6960,192.168.1.61:6970' });
let myclient = new Client({
  url: '172.19.2.10:6960,172.19.2.10:6971,192.168.1.61:6960,172.30.4.80:6960'
});

console.log('start');
// myclient
//   .request('172.19.2.10:6960', 'book.hello')
//   .then(ret => {
//     console.log(ret);
//   })
//   .catch(err => {
//     console.error(err);
//   });

myclient
  .call('book.hi')
  .then(ret => {
    console.log(ret, typeof ret);
  })
  .catch(err => {
    console.error(err, 'there');
  });

// myclient
//   .request('172.19.2.10:6969', 'book.hello')
//   .then(ret => {
//     console.log(ret);
//   })
//   .catch(err => {
//     console.error(err);
//   });

// setInterval(() => {
//   let t = Date.now();
//   myclient
//     .call('book.hi')
//     .then(ret => {
//       console.log(Date.now() - t);
//       console.log(ret);
//       console.log(myclient.actionProviders);
//       // console.log(myclient.connectionMap);
//     })
//     .catch(err => {
//       console.error(err, '===------');
//     });
// }, 5000);
