import { Context, NextFunc } from './interface';

export async function responseTime(context: Context, next: NextFunc) {
  let start = Date.now();
  await next();
  console.log(`${context.action.name} took:${Date.now() - start}ms`);
}
