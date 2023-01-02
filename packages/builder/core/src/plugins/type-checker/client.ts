import { fork } from 'child_process';

const workerUrl = require('./worker.ts?worker');

export function createTypeCheckerClient(cwd: string) {
  const worker = fork(workerUrl);

  return {
    connect: () => {
      worker.send({ cwd });
    },
    report: () => {
      // ..
    },
  };
}
