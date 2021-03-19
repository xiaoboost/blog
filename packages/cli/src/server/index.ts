import Koa from 'koa';

import type { promises as fs } from 'fs';

import { join } from 'path';
import { getType } from 'mime';

export function serve(dir: string, port: number, fileSys: typeof fs) {
  const app = new Koa();

  app.listen(port);
    
  app.use(async (ctx, next) => {
    if (ctx.method !== 'GET' && ctx.method !== 'HEAD') {
      ctx.status = 405;
      ctx.length = 0;
      ctx.set('Allow', 'GET, HEAD');
      next();
      return false;
    }

    const filePath = ctx.path[ctx.path.length - 1] === '/'
      ? join(dir, ctx.path, 'index.html')
      : join(dir, ctx.path);
    
    const stat = await fileSys.stat(filePath).catch(() => void 0);

    if (!stat) {
      ctx.status = 404;
      ctx.length = 0;
      next();
      return false;
    }

    ctx.type = getType(filePath)!;
    ctx.lastModified = new Date();

    ctx.set('Accept-Ranges', 'bytes');
    ctx.set('Cache-Control', 'max-age=0');

    ctx.length = stat.size;
    ctx.body = await fileSys.readFile(filePath);

    next();
  });

  return app;
}
