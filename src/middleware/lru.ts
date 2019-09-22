const QuickLRU = require('quick-lru');
import { Context, NextFunc } from './interface';

const cacheStore = new QuickLRU({ maxSize: 1000 });

export async function LRU(context: Context, next: NextFunc) {
  console.log('========= payload', context.payload);
  const { payload } = context;
  if (payload === undefined) {
    console.error('payload is empty, did not provide a cache key');
    await next();
    return;
  }

  let key = '';
  // self define key
  if (payload && payload.__cacheKey) {
    key = payload.__cacheKey;
  } else {
    key = JSON.stringify(payload);
  }

  const data = cacheStore.get(key);
  if (data !== undefined) {
    context.value = data;
    console.log('return from cache, key:', key);
    return;
  }

  await next();
  cacheStore.set(key, context.value);
}
