import 'reflect-metadata';
import { Server, ServerOptions } from '../server';

const ACTIONS = 'ACTIONS';
const ACTION_MAP = 'ACTION_MAP';
const SERVICE_NAME = 'SERVICE_NAME';

export const Service = (args?: any): ClassDecorator => (target: any) => {};

export const Action = (args?: any): MethodDecorator => (
  target: any,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => {
  const actionMap = Reflect.getMetadata(ACTION_MAP, target) || {};
  const actionName = `${target.constructor.name.toLowerCase()}.${propertyKey as string}`;
  actionMap[actionName] = descriptor.value;
  Reflect.defineMetadata(ACTION_MAP, actionMap, target);
};

export const Module = (services: any[]): ClassDecorator => (target: any) => {
  const actions = Reflect.getMetadata(ACTIONS, target) || {};
  for (const service of services) {
    const amap = Reflect.getMetadata(ACTION_MAP, service.prototype);
    Object.assign(actions, amap);
  }
  Reflect.defineMetadata(ACTIONS, actions, target);
};

export class Factory {
  static create(m: any, options?: ServerOptions): Server {
    const actions = Reflect.getMetadata(ACTIONS, m);
    const server = new Server(options);
    Object.keys(actions).forEach(k => {
      server.addAction({ name: k, handler: actions[k] });
    });

    return server;
  }
}
