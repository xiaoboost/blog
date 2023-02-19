import { isMainThread, parentPort } from 'worker_threads';
import type { PostData, ReturnData } from '../../../utils';
import { EventData, EventName } from '../types';
import { LanguageService } from './server';

if (isMainThread) {
  throw new Error('类型检查只能运行在 Worker 中');
}

let server: LanguageService | undefined;

if (parentPort) {
  parentPort!.on('message', async ({ id, data }: PostData<EventData>) => {
    const result: ReturnData = {
      id,
    };

    try {
      switch (data.name) {
        case EventName.StartServer:
          server = new LanguageService(...(data.params as [any, any]));
          break;
        case EventName.FilesChanged:
          result.return = server?.filesChanged(...(data.params as string[]));
          break;
        case EventName.GetTsDiagnostics:
          result.return = server?.getDiagnostics();
          break;
        case EventName.Dispose:
          result.return = server?.dispose();
          break;
        default:
          result.error = {
            name: 'ERROR_EVENT_NAME',
            message: `未知的事件名称：${data.name}`,
          };
      }
    } catch (e: any) {
      result.error = {
        name: e.name,
        message: e.message,
      };
    }

    if (!server && !result.error) {
      result.error = {
        name: 'SERVER_NOT_INIT',
        message: '语言服务器尚未初始化',
      };
    }

    if (parentPort) {
      parentPort.postMessage(result);
    }
  });
}
