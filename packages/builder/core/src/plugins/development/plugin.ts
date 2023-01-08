import Koa from 'koa';
import Ws from 'koa-websocket';
import path from 'path';

import type { BuilderPlugin } from '@blog/types';
import { createServer, Server as HTTPServer } from 'http';
import { AssetData } from '@blog/types';
import { WebSocket } from 'ws';
import { remove, delay } from '@xiao-ai/utils';
import { staticServe, transformServe } from './middleware';
import { HMRData, HMRKind, HMRUpdateKind, DevOptions } from './types';
import { isFileEqual, getHtmlDiff } from './utils';

const pluginName = 'development';

/** 获取文件差异 */
function getFilesDiff(files: AssetData[], vfs: Map<string, Buffer>) {
  const data: HMRData = {
    kind: HMRKind.Update,
    updates: [],
  };

  for (const file of files) {
    const oldFile = vfs.get(file.path);

    if (!oldFile || isFileEqual(oldFile, file.content)) {
      continue;
    }

    const ext = path.extname(file.path);

    if (ext === '.js') {
      data.updates.push({
        kind: HMRUpdateKind.JS,
        path: file.path,
        code: file.content.toString(),
      });
    } else if (ext === '.css') {
      data.updates.push({
        kind: HMRUpdateKind.CSS,
        path: file.path,
      });
    } else if (ext === '.html') {
      data.updates.push(...getHtmlDiff(oldFile.toString(), file.content.toString(), file.path));
    }
  }

  return data;
}

/** 向前端广播数据 */
function broadcast(sockets: WebSocket[], data: HMRData) {
  for (const socket of sockets) {
    socket.send(JSON.stringify(data));
  }
}

export const Development = (opt?: DevOptions): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const {
      options: { watch, hmr },
      logger,
    } = builder;

    if (!watch) {
      return;
    }

    const app = Ws(new Koa());
    const vfs = new Map<string, Buffer>();
    const sockets: WebSocket[] = [];
    const port = opt?.port ?? 6060;

    let server: HTTPServer | undefined = createServer(app.callback());

    app.use(staticServe(vfs, builder)).listen(opt?.port ?? 6060);

    if (hmr) {
      app.use(transformServe(vfs, builder));
      app.ws.server?.on('connection', (socket: WebSocket) => {
        sockets.push(socket);

        socket.on('message', (data: any) => {
          logger.log(`接收消息: ${JSON.stringify(data.toString())}`);
        });

        socket.on('close', () => {
          remove(sockets, socket);
        });
      });
    }

    builder.hooks.success.tapPromise(pluginName, async () => {
      const assets = builder.getAssets();
      const log = () => logger.info(`网站已部署至：http://127.0.0.1:${port}/`);

      for (const file of assets) {
        vfs.set(file.path, file.content);
      }

      if (!hmr) {
        log();
        return;
      }

      return delay().then(() => {
        const diff = getFilesDiff(assets, vfs);

        if (diff && 'updates' in diff && diff.updates.length > 0) {
          broadcast(sockets, diff);
        }

        log();
      });
    });

    builder.hooks.done.tapPromise(pluginName, () => {
      sockets.forEach((socket) => socket.terminate());
      sockets.length = 0;

      return new Promise<void>((resolve) => {
        if (server) {
          server.close(() => {
            server = undefined;
            resolve();
          });
        } else {
          resolve();
        }
      });
    });
  },
});
