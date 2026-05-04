/* eslint-disable */

const { parentPort } = require('worker_threads');

parentPort.on('message', (data) => {
  parentPort.postMessage({ id: data.id, return: data.data });
});
