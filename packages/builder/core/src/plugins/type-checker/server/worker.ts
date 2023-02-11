import { isMainThread, parentPort } from 'worker_threads';
import { EventData, EventName } from '../types';

if (isMainThread) {
  throw new Error('类型检查只能运行在 Worker 中');
}

if (parentPort) {
  parentPort!.on('message', async (event: EventData) => {
    const result = { ...event };

    try {
      switch (event.name) {
        case EventName.FileCreated:
          break;
        case EventName.FileChanged:
          break;
        case EventName.StartServer:
          break;
        case EventName.GetTsDiagnostics:
          break;
        default:
          result.error = {
            name: 'ERROR_EVENT_NAME',
            message: `未知的事件名称：${event.name}`,
          };
      }
    } catch (e: any) {
      result.error = {
        name: e.name,
        message: e.message,
      };
    }

    if (parentPort) {
      parentPort.postMessage(result);
    }
  });
}
