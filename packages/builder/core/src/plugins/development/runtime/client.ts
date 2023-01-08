import './module';

import { HMRKind, HMRData, HMRUpdate, HMRUpdateKind } from '../types';
import { showError, closeError } from './error';

import {
  getSocketUrl,
  hmrLog,
  wbsLog,
  reloadCSS,
  reloadHTML,
  reloadJS,
  hasCSS,
  hasJs,
  isHTMLFile,
} from './utils';

function ReceiveHMRData(event: MessageEvent<string>) {
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
}

function updatePage(updates: HMRUpdate[]) {
  for (const data of updates) {
    switch (data.kind) {
      case HMRUpdateKind.HTML: {
        if (isHTMLFile(data.path)) {
          hmrLog(`Update '${data.path}'`);
          reloadHTML(data.selector, data.content);
        }

        break;
      }

      case HMRUpdateKind.CSS: {
        if (hasCSS(data.path)) {
          hmrLog(`Update '${data.path}'`);
          reloadCSS(data.path);
        }

        break;
      }

      case HMRUpdateKind.JS: {
        if (hasJs(data.path)) {
          hmrLog(`Update '${data.path}'`);
          reloadJS(data.path, data.code);
        }

        break;
      }

      default: {
        hmrLog(`Unknown update kind: ${(data as any).kind}`);
        break;
      }
    }
  }
}

if ('WebSocket' in window) {
  const socket = new WebSocket(getSocketUrl(), 'blog-dev-server');
  socket.addEventListener('message', ReceiveHMRData);
  wbsLog('Dev Server is running...');
} else {
  wbsLog('WebSocket is not supported.');
}
