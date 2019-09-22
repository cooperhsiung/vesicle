import { reform } from '../helper';
import { Server } from '../server';

export function nodes(this: Server) {
  return this.nodes;
}

export function health(this: Server) {
  return 1;
}

export function hasAction(this: Server, actionName: string): boolean {
  actionName = reform(actionName, this.nodeID);
  return !!this.actionMap[actionName];
}

export function actions(this: Server) {
  return this.actionMap;
}

export function connections(this: Server) {
  return Object.values(this.connectionMap).map(c => ({
    localAddress: c.localAddress,
    localPort: c.localPort,
    destroyed: c.destroyed,
    remoteAddress: c.remoteAddress,
    remotePort: c.remotePort
  }));
}

export function getConnections(this: Server) {
  return new Promise(resolve => {
    this.socket.getConnections((err, count) => {
      if (err) {
        console.error(err);
        return resolve(0);
      }
      resolve(count);
    });
  });
}
