import { extname, join } from 'path';
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
      const extension = extname(requestPath).toLowerCase();
      const destination = ctx.get('Sec-Fetch-Dest');
      const acceptsHtml = ctx.get('Accept').split(',').some((type) => type.trim().split(';')[0] === 'text/html');
      const isNavigation = destination === 'document' || destination === 'iframe' || (!destination && acceptsHtml);
      const isPage = !extension || extension === '.html' || extension === '.htm';
      const notFound = isNavigation && isPage
        ? vfs.get(normalize('/', builder.options.publicPath, '404.html'))
        : undefined;

      ctx.status = 404;
      ctx.set('Cache-Control', 'no-store');
      ctx.vary('Accept');
      ctx.vary('Sec-Fetch-Dest');

      if (notFound) {
        ctx.type = 'html';
        ctx.body = notFound;
        ctx.length = notFound.byteLength;
      }
      else {
        ctx.length = 0;
      }

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
