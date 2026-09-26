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
  const image = Buffer.from([
    0xff, 0xd8, 0xff, 0xd9,
  ]);

  before(async () => {
    const files = new Map([
      ['/images/鸣潮 100%.jpg', image],
      ['/images/%E9.jpg', image],
      ['/images/plain.jpg', image],
      ['/中文目录/index.html', Buffer.from('<p>文章</p>')],
    ]);
    const builder = { logger: { info() {} } } as unknown as BuilderInstance;
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
});
