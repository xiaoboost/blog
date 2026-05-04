/* eslint-disable */

const { parentPort } = require('worker_threads');

parentPort.on('message', (data) => {
  if (data.data === 'throw') {
    parentPort.postMessage({ id: data.id, error: new Error('worker error') });
  }
  else {
    parentPort.postMessage({ id: data.id, return: data.data });
  }
});
