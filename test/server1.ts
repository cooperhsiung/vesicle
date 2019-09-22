import { Server } from '../src/server';
import { responseTime, LRU } from '../src/middleware';

let server = new Server({ nodeID: 'node1' });

server.addAction({
  name: 'list',
  handler: () => {
    console.log(1);
  }
});

server.addAction({
  name: 'book.hello',
  handler: () => {
    // console.log("========= 1",1);
    return 'hello';
  }
});

server.addAction({
  name: 'book.hi',
  handler: async () => {
    await sleep(1000);
    return 'sleep hi';
  },
  use: responseTime
});

server.addAction({
  name: 'book.cache',
  handler: async () => {
    await sleep(5000);
    return 'cache book';
  },
  use: [responseTime, LRU]
});

server.addAction({
  name: 'book.hi2',
  handler: async () => {
    throw new Error('hi2');
  }
});

function sleep(delay = 1000) {
  return new Promise(resolve => setTimeout(resolve, delay));
}

server.listen(6960);

// console.log(server);
// console.log(server);
