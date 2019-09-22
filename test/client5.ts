import { Client } from '../src/client';
import { request } from '../src/helper';

// let myclient = new Client({ url: '192.168.1.61:6960,192.168.1.61:6970' });
let myclient = new Client({
  url: '172.19.2.10:6960,172.19.2.10:6970,192.168.1.61:6960,172.30.4.80:6960'
});

async function test() {
  let i = 10000;
  await myclient.call('book.hello');
  console.log('start');
  console.time('build');
  while (i--) {
    await myclient.call('book.hello');
    // await request('172.30.4.80:6960/book.hello');
  }
  console.timeEnd('build');
  await sleep(2000);
  console.log(process.memoryUsage());
  console.log(process.cpuUsage());
}

// 10000 - 1093.457ms 1137.277ms 1112.310ms 1238.935ms

// { rss: 147386368,
//   heapTotal: 133087232,
//   heapUsed: 91902600,
//   external: 87805 }
// { user: 3140000, system: 562000 }
// build: 1160.648ms

// { rss: 149082112,
//   heapTotal: 127889408,
//   heapUsed: 102317360,
//   external: 431677 }
// { user: 3453000, system: 468000 }
// build: 1272.460ms

// build: 1106.699ms
// { rss: 151281664,
//   heapTotal: 131035136,
//   heapUsed: 102726808,
//   external: 332605 }
// { user: 3531000, system: 546000 }

// -- clearTimerout
// build: 1429.579ms
// { rss: 56274944,
//   heapTotal: 37822464,
//   heapUsed: 30512744,
//   external: 142111 }
// { user: 1265000, system: 343000 }

// build: 1160.729ms
// { rss: 146128896,
//   heapTotal: 126316544,
//   heapUsed: 102927640,
//   external: 534061 }
// { user: 3468000, system: 484000 }

// -- add notify
// build: 1204.284ms
// { rss: 56172544,
//   heapTotal: 37822464,
//   heapUsed: 27138704,
//   external: 24573 }
// { user: 1078000, system: 328000 }

// -- add strategy

// build: 1267.867ms
// { rss: 145666048,
//   heapTotal: 125792256,
//   heapUsed: 88628704,
//   external: 43746 }
// { user: 3437000, system: 625000 }

// build: 1227.929ms
// { rss: 56778752,
//   heapTotal: 39395328,
//   heapUsed: 30558696,
//   external: 128708 }
// { user: 1203000, system: 390000 }

// --- new protocol

// build: 1242.034ms
// { rss: 56758272,
//   heapTotal: 38871040,
//   heapUsed: 28967048,
//   external: 37561 }
// { user: 1312000, system: 296000 }

// build: 1144.592ms
// { rss: 56311808,
//   heapTotal: 38871040,
//   heapUsed: 29951208,
//   external: 85072 }
// { user: 1062000, system: 359000 }

test();

function sleep(delay = 1000) {
  return new Promise(resolve => setTimeout(resolve, delay));
}

// setInterval(() => {
//   let t = Date.now();
//   myclient
//     .call('book.hi')
//     .then(ret => {
//       console.log(Date.now() - t);
//       console.log(ret);
//       // console.log(myclient.actionProviders);
//       // console.log(myclient.connectionMap);
//     })
//     .catch(err => {
//       console.error(err, '===');
//     });
// }, 1000);
