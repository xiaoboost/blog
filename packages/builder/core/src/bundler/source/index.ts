import { defineUtils, forEach, forOnce, waitReady, callHook } from '@blog/context/runtime';

forOnce(() => {
  console.log('forOnce');
});

forEach((runtime) => {
  console.log('forEach');

  runtime.hooks.beforeStart.tap('test', () => {
    console.log('beforeStart');
  });
});

console.log('start');

export default async () => {
  await waitReady;
  await callHook('beforeStart');
  console.log('end');
};
