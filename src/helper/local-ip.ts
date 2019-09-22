import os from 'os';

export const localIp = Object.values(os.networkInterfaces())
  .reduce((s, v) => s.concat(v), [])
  .find(e => e.family === 'IPv4' && !e.internal)!.address;
