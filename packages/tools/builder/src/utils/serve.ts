import Koa from 'koa';

import { join } from 'path';
import { getType } from 'mime';
import { wait } from '@xiao-ai/utils';
import { normalize } from '@blog/shared/node';
import { log } from './log';

export function serve(port: number, vfs: Map<string, Buffer>, isLoading?: () => boolean) {
  const app = new Koa();

  app.listen(port);

  app.use(async (ctx, next) => {
    if (isLoading?.()) {
      await wait(() => !isLoading(), 100);
    }

    if (ctx.method !== 'GET' && ctx.method !== 'HEAD') {
      ctx.status = 405;
      ctx.length = 0;
      ctx.set('Allow', 'GET, HEAD');
      next();
      return false;
    }

    const filePath = normalize(
      ctx.path[ctx.path.length - 1] === '/'
        ? join('/', ctx.path, 'index.html')
        : join('/', ctx.path),
    );

    log.log(`请求文件 ${filePath}`);

    const file = vfs.get(filePath);

    if (!file) {
      ctx.status = 404;
      ctx.length = 0;
      next();
      return false;
    }

    ctx.type = getType(filePath)!;
    ctx.lastModified = new Date();

    ctx.set('Accept-Ranges', 'bytes');
    ctx.set('Cache-Control', 'max-age=0');

    ctx.length = file.byteLength;
    ctx.body = file;

    next();
  });

  return app;
}
