import { Action } from '../server';

export type Context = {
  value?: any; // return value
  payload?: any; // parameter
  action: Action;
};

export type NextFunc = Function;

export type Middleware = (context: Context, next: NextFunc) => any;
