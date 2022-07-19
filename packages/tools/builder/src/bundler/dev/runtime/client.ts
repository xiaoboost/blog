import { HMRKind, HMRUpdateKind, HMRData } from '../types';
import { getSocketUrl, reloadPage, reloadCSS, hmrLog, wbsLog, reloadElement } from './utils';
import { showError, closeError } from './error';

if ('WebSocket' in window) {
  const socketUrl = getSocketUrl();
  const socket = new WebSocket(socketUrl, 'blog-dev-server');

  socket.addEventListener('message', (event) => {
    const msg: HMRData = JSON.parse(event.data);

    switch (msg.kind) {
      case HMRKind.Reload:
        hmrLog(`Reload Page`);
        reloadPage();
        break;

      case HMRKind.Update:
        closeError();

        for (const data of msg.updates) {
          hmrLog(`Update '${data.path}'`);

          if (data.kind === HMRUpdateKind.CSS) {
            reloadCSS();
          } else {
            reloadElement(data.selector, data.content);
          }
        }
        break;

      case HMRKind.Error:
        closeError();
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
