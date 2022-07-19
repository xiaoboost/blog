import Koa from 'koa';
import Ws from 'koa-websocket';
import path from 'path';

import { createServer, Server as HTTPServer } from 'http';
import { WebSocket } from 'ws';
import { remove, delay } from '@xiao-ai/utils';
import { staticServe, transformServe } from './middleware';
import { HMRData, HMRKind, HMRUpdateKind, ServerOption } from './types';
import { log } from '../../utils';

/** 调试服务器 */
export class DevServer {
  /** 文件系统 */
  private _vfs = new Map<string, Buffer>();
  /** 服务器选项 */
  private _option: Required<ServerOption>;
  /** 通信服务器 */
  private _server?: HTTPServer;
  /** WebSocket 连接 */
  private _sockets: WebSocket[] = [];

  constructor(opt: ServerOption) {
    this._option = {
      ...opt,
      port: opt.port ?? 6060,
      hmr: opt.hmr ?? true,
    };
  }

  get isStart() {
    return Boolean(this._server);
  }

  private onWsConnection(socket: WebSocket) {
    this._sockets.push(socket);

    socket.on('message', (data: any) => {
      log.log(`接收消息: ${JSON.stringify(data.toString())}`);
    });

    socket.on('close', () => {
      remove(this._sockets, socket);
    });
  }

  private sendFilesDiff(files: AssetData[]) {
    const data: HMRData = {
      kind: HMRKind.Update,
      updates: [],
    };

    for (const file of files) {
      const ext = path.extname(file.path);

      if (ext === '.js') {
        data.updates.push({
          kind: HMRUpdateKind.JS,
          path: file.path,
        });
      } else if (ext === '.css') {
        data.updates.push({
          kind: HMRUpdateKind.CSS,
          path: file.path,
        });
      } else if (ext === '.html') {
        // TODO: 怎么求 html 文件的 diff
      }
    }

    delay().then(() => this.broadcast(data));
  }

  /** 开启服务 */
  start() {
    if (this._server) {
      return;
    }

    const app = Ws(new Koa());

    app.use(transformServe(this._vfs)).use(staticServe(this._vfs)).listen(this._option.port);
    app.ws.server?.on('connection', this.onWsConnection.bind(this));

    this._server = createServer(app.callback());
  }

  /** 关闭服务器 */
  close() {
    this._sockets.forEach((socket) => socket.terminate());
    this._sockets = [];

    return new Promise<void>((resolve) => {
      if (this._server) {
        this._server.close(() => {
          this._server = undefined;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /** 写入文件 */
  writeFiles(files: AssetData[]) {
    if (this._option.hmr && this.isStart) {
      this.sendFilesDiff(files);
    }

    for (const file of files) {
      this._vfs.set(file.path, Buffer.from(file.content));
    }
  }

  /** 向前端广播数据 */
  broadcast(data: HMRData) {
    if (!this._option.hmr || !this.isStart) {
      return;
    }

    for (const socket of this._sockets) {
      socket.send(JSON.stringify(data));
    }
  }
}
