import { HMRKind, HMRData } from '../types';
import { showError, closeError } from './error';
import { getSocketUrl, hmrLog, wbsLog, updatePage } from './utils';

if ('WebSocket' in window) {
  const socketUrl = getSocketUrl();
  const socket = new WebSocket(socketUrl, 'blog-dev-server');

  socket.addEventListener('message', (event) => {
    const msg: HMRData = JSON.parse(event.data);

    switch (msg.kind) {
      case HMRKind.Update:
        closeError();
        updatePage(msg.updates);
        break;

      case HMRKind.Error:
        showError(msg.errors);
        break;

      default:
        hmrLog(`Unknown data kind: ${(msg as any).kind}`);
        break;
    }
  });

  wbsLog('Dev Server is running...');
} else {
  wbsLog('WebSocket is not supported.');
}
