// alveolar 172.19.2.10:6969 join 172.19.2.10:6970
// alveolar 172.19.2.10:6970 join 172.19.2.10:6969

// alveo 172.19.2.10:6970 join 172.19.2.10:6969
// alveo 172.19.2.10:6970 leave 172.19.2.10:6969
// alveo nodes,actions,

const args = process.argv;

const { request } = require('../helper');

if (args.length !== 5) {
  console.error('arguments length ask for 5');
  process.exit(1);
}

if (args[3] !== 'join') {
  console.error('use `join` in command');
  process.exit(1);
}

// todo

// a join b
// a actions
// a nodes

run();

async function run() {
  try {
    await request(`${args[4]}/join`, {
      addr: args[2],
      initiator: args[2]
    });
    console.log('join success');
  } catch (e) {
    console.error(e);
    console.log('join failed');
  }
}
