import { request } from '../src/helper';

// join to a cluster
request(`172.19.2.10:6960/join`, { addr: '172.19.2.10:6970' })
  .then(ret => {
    console.log(ret);
  })
  .catch(err => {
    console.error(err);
  });
