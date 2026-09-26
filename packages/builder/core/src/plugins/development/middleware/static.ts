import { join } from 'path';
import { normalize } from '@blog/node';
import type { BuilderInstance } from '@blog/types';
import type { ParameterizedContext } from 'koa';
import { getType } from 'mime';

export function staticServe(vfs: Map<string, Buffer>, builder: BuilderInstance) {
  return (ctx: ParameterizedContext) => {
    if (ctx.method !== 'GET' && ctx.method !== 'HEAD') {
      ctx.status = 405;
      ctx.length = 0;
      ctx.set('Allow', 'GET, HEAD');
      return;
    }

    // 浏览器会编码中文、空格等字符；虚拟文件系统保存的是原始资源路径。
    let requestPath: string;
    try {
      requestPath = decodeURIComponent(ctx.path);
    }
    catch {
      ctx.status = 400;
      ctx.length = 0;
      return;
    }

    const filePath = normalize(
      requestPath.endsWith('/')
        ? join('/', requestPath, 'index.html')
        : join('/', requestPath),
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
