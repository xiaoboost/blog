/// <reference lib="dom" />

import { HMRKind, HMRUpdateKind, HMRData } from '../types';
import { getSocketUrl, reloadPage, reloadAllCSS, hmrLog, wbsLog } from './utils';
import { showError, closeError } from './error';

if ('WebSocket' in window) {
  const socketUrl = getSocketUrl();
  const socket = new WebSocket(socketUrl, 'blog-dev-server');

  console.log(socketUrl);

  socket.addEventListener('message', (event) => {
    const msg: HMRData = JSON.parse(event.data);

    switch (msg.kind) {
      case HMRKind.Reload:
        hmrLog(`Reload Page.`);
        reloadPage();
        break;

      case HMRKind.Update:
        closeError();

        for (const data of msg.updates) {
          hmrLog(`${data.path} update`);

          if (data.kind === HMRUpdateKind.CSS) {
            reloadAllCSS();
          } else {
            // TODO:
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
