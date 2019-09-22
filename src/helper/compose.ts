import { Handler } from '../server';
import { Context, Middleware } from '../middleware';

export function compose(
  handler: Handler,
  context: Context,
  middlewares: Middleware[]
) {
  return async function(payload: any) {
    const len = middlewares.length;
    if (len === 0) return handler(payload);
    context.payload = payload;
    await dispatch(0);
    return context.value;
    async function dispatch(i: number) {
      const mw = middlewares[i];
      return mw(context, async function next() {
        if (i === len - 1) {
          context.value = await handler(payload);
          return;
        }
        return dispatch(i + 1);
      });
    }
  };
}
