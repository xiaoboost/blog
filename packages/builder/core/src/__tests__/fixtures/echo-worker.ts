import { parentPort } from 'worker_threads';
import type { PostData } from '../../utils/worker';

class Reply {
  constructor(public id: number, public value: unknown) {}
}

parentPort!.on('message', ({ id, data }: PostData) => {
  const reply = new Reply(id, data);
  parentPort!.postMessage({ id: reply.id, return: reply.value });
});
