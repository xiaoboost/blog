import { join } from 'path';
import { expect, describe, it } from '@blog/test-toolkit';
import { WorkerController } from '../utils/worker';

const fixturesDir = join(__dirname, 'fixtures');

describe('WorkerController', () => {
  it('send 发送数据并收到返回值', async () => {
    const worker = new WorkerController(join(fixturesDir, 'echo-worker.js'));
    const result = await worker.send({ msg: 'hello' });
    expect(result).deep.eq({ msg: 'hello' });
    await worker.worker.terminate();
  });

  it('send 多次调用，返回值与请求一一对应', async () => {
    const worker = new WorkerController(join(fixturesDir, 'echo-worker.js'));

    const results = await Promise.all([
      worker.send('first'),
      worker.send('second'),
      worker.send('third'),
    ]);

    expect(results).deep.eq([
      'first', 'second', 'third',
    ]);
    await worker.worker.terminate();
  });

  it('worker 返回 error 时 send 的 promise reject', async () => {
    const worker = new WorkerController(join(fixturesDir, 'error-worker.js'));

    let caught: Error | undefined;
    try {
      await worker.send('throw');
    }
    catch (e) {
      caught = e as Error;
    }

    expect(caught).not.undefined;
    expect(caught!.message).eq('worker error');
    await worker.worker.terminate();
  });

  it('正常消息不受 error 请求影响', async () => {
    const worker = new WorkerController(join(fixturesDir, 'error-worker.js'));

    const good = worker.send('ok');

    let caught = false;
    try {
      await worker.send('throw');
    }
    catch (_) {
      caught = true;
    }

    const result = await good;
    expect(caught).true;
    expect(result).eq('ok');
    await worker.worker.terminate();
  });
});
