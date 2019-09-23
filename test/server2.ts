import { Server } from '../src/server';

let server = new Server({ nodeID: 'node2' });

server.addAction({
  name: 'list',
  handler: () => {
    console.log(1);
  }
});

server.addAction({
  name: 'book.hello',
  handler: () => {
    return 'hello';
  }
});

server.addAction({
  name: 'book.hi',
  handler: async () => {
    return 'hi';
  },
  use: []
});

server.addAction(() => {}, 'asd', 'v1');

// console.log(server.actionMap);

server.listen(6970);
