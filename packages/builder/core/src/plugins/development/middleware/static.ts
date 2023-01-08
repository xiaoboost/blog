import { ParameterizedContext } from 'koa';
import { join } from 'path';
import { getType } from 'mime';
import { normalize } from '@blog/node';
import type { BuilderInstance } from '@blog/types';

export function staticServe(vfs: Map<string, Buffer>, builder: BuilderInstance) {
  return (ctx: ParameterizedContext) => {
    if (ctx.method !== 'GET' && ctx.method !== 'HEAD') {
      ctx.status = 405;
      ctx.length = 0;
      ctx.set('Allow', 'GET, HEAD');
      return;
    }

    const filePath = normalize(
      ctx.path[ctx.path.length - 1] === '/'
        ? join('/', ctx.path, 'index.html')
        : join('/', ctx.path),
    );

    builder.logger.info(`请求文件 ${filePath}`);

    const file = vfs.get(filePath);

    if (!file) {
      ctx.status = 404;
      ctx.length = 0;
      return;
    }

    ctx.type = getType(filePath)!;
    ctx.lastModified = new Date();

    ctx.set('Accept-Ranges', 'bytes');
    ctx.set('Cache-Control', 'max-age=0');

    ctx.length = file.byteLength;
    ctx.body = file;
  };
}
