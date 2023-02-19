import { Worker } from 'worker_threads';

export interface PostData<P = any> {
  /** 事件编号 */
  id: number;
  /** 发送数据 */
  data: P;
}

export interface ReturnData<R = any> {
  /** 事件编号 */
  id: number;
  /** 返回数据 */
  return?: R;
  /** 运行错误 */
  error?: Error;
}

interface CacheData extends PostData {
  /** 事件结束回调 */
  resolve: any;
  /** 事件出错回调 */
  reject: any;
}

export class WorkerController {
  /** 事件计数器 */
  count = 1;

  /** 事件数据 */
  events: CacheData[] = [];

  /** 子进程实例 */
  worker: Worker;

  constructor(workerPath: string) {
    this.worker = new Worker(workerPath);
    this.start();
  }

  private start() {
    this.worker.addListener('message', (data: ReturnData) => {
      const index = this.events.findIndex((item) => item.id === data.id);

      if (index < 0) {
        return;
      }

      const event = this.events[index];

      this.events.splice(index, 1);

      if (data.error) {
        event.reject(data.error);
      } else {
        event.resolve(data.return);
      }
    });
  }

  send<R = any>(val: any) {
    return new Promise<R>((resolve, reject) => {
      const data: PostData = {
        id: this.count++,
        data: val,
      };

      this.events.push({
        ...data,
        resolve,
        reject,
      });
      this.worker.postMessage(data);
    });
  }
}
