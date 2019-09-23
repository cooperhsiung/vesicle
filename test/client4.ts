import { request } from '../src/helper';

request('172.30.4.80:6960/connections', { name: 'asd' })
  .then(ret => {
    console.log(ret);
  })
  .catch(err => {
    console.error(err);
  });
