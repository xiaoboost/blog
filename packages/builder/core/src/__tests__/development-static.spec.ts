import type { Server } from 'http';
import type { AddressInfo } from 'net';
import { expect, describe, it } from '@blog/test-toolkit';
import type { BuilderInstance } from '@blog/types';
import Koa from 'koa';
import { before, after } from 'mocha';
import { staticServe } from '../plugins/development/middleware/static';

describe('开发服务器静态资源', () => {
  let server: Server;
  let origin: string;
  const notFound = '<!DOCTYPE html><html><body>这一页，好像溜走了。</body></html>';
  const image = Buffer.from([
    0xff,
    0xd8,
    0xff,
    0xd9,
  ]);

  before(async () => {
    const files = new Map([
      ['/images/鸣潮 100%.jpg', image],
      ['/images/%E9.jpg', image],
      ['/images/plain.jpg', image],
      ['/中文目录/index.html', Buffer.from('<p>文章</p>')],
      ['/404.html', Buffer.from(notFound)],
    ]);
    const builder = { logger: { info() {} }, options: { publicPath: '/' } } as unknown as BuilderInstance;
    const app = new Koa().use(staticServe(files, builder));
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve);
    });
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  });

  it('浏览器编码后的中文、空格和百分号图片路径返回原始图片', async () => {
    const response = await fetch(`${origin}/images/${encodeURIComponent('鸣潮 100%.jpg')}?v=1`);
    expect(response.status).eq(200);
    expect(response.headers.get('content-type')).eq('image/jpeg');
    expect(Buffer.from(await response.arrayBuffer())).deep.eq(image);
  });

  it('只解码一次，保留文件名中的百分号转义文本', async () => {
    const response = await fetch(`${origin}/images/%25E9.jpg`);
    expect(response.status).eq(200);
    expect(Buffer.from(await response.arrayBuffer())).deep.eq(image);
  });

  it('中文目录仍能解析到 index.html', async () => {
    const response = await fetch(`${origin}/${encodeURIComponent('中文目录')}/`);
    expect(response.status).eq(200);
    expect(await response.text()).eq('<p>文章</p>');
  });

  it('非法百分号编码返回 400', async () => {
    for (const pathname of ['/images/%.jpg', '/images/%E9.jpg']) {
      const response = await fetch(origin + pathname);
      expect(response.status).eq(400);
      expect(await response.text()).eq('Bad Request');
    }
  });

  it('保留普通路径、HEAD、404 和方法限制的行为', async () => {
    const response = await fetch(`${origin}/images/plain.jpg`, { method: 'HEAD' });
    expect(response.status).eq(200);
    expect(response.headers.get('content-length')).eq(String(image.length));
    expect(await response.text()).eq('');
    const missing = await fetch(`${origin}/images/missing.jpg`);
    expect(missing.status).eq(404);
    const post = await fetch(`${origin}/images/plain.jpg`, { method: 'POST' });
    expect(post.status).eq(405);
    expect(post.headers.get('allow')).eq('GET, HEAD');
  });

  it('缺失的页面返回自定义 HTML，保留原地址与 404 状态', async () => {
    for (const path of ['/missing', '/deep/missing/', '/missing.html']) {
      const response = await fetch(origin + path, { headers: { Accept: 'text/html' } });
      expect(response.status).eq(404);
      expect(response.redirected).false;
      expect(response.url).eq(origin + path);
      expect(response.headers.get('content-type')).include('text/html');
      expect(response.headers.get('cache-control')).eq('no-store');
      expect(await response.text()).eq(notFound);
    }
  });

  it('HEAD 返回错误页长度但没有响应正文，直接预览 404.html 仍正常', async () => {
    const head = await fetch(`${origin}/missing/`, { method: 'HEAD', headers: { Accept: 'text/html' } });
    expect(head.status).eq(404);
    expect(head.headers.get('content-length')).eq(String(Buffer.byteLength(notFound)));
    expect(await head.text()).eq('');
    const preview = await fetch(`${origin}/404.html`);
    expect(preview.status).eq(200);
    expect(await preview.text()).eq(notFound);
  });

  it('图片、脚本、样式和 API 请求不会被替换成错误页 HTML', async () => {
    for (const path of ['/missing.jpg', '/missing.js', '/missing.css']) {
      const response = await fetch(origin + path, { headers: { Accept: 'text/html' } });
      expect(response.status).eq(404);
      expect(await response.text()).not.eq(notFound);
    }
    const requests: Record<string, string>[] = [
      { Accept: 'application/json' },
      { Accept: '*/*' },
      { Accept: 'text/html', 'Sec-Fetch-Dest': 'script' },
    ];
    for (const headers of requests) {
      const response = await fetch(`${origin}/missing`, { headers });
      expect(response.status).eq(404);
      expect(await response.text()).not.eq(notFound);
    }
  });

  it('显式的文档导航可以使用错误页', async () => {
    const response = await fetch(`${origin}/missing`, { headers: { 'Sec-Fetch-Dest': 'document' } });
    expect(response.status).eq(404);
    expect(await response.text()).eq(notFound);
  });
});
