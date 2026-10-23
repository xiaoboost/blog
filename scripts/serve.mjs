import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import { extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sirv from 'sirv';

const directory = fileURLToPath(new URL('../dist/', import.meta.url));
const notFound = readFileSync(new URL('../dist/404.html', import.meta.url));
const staticFiles = sirv(directory, { gzip: true, brotli: true });
const host = process.env.HOST || '0.0.0.0';
const port = Number(process.env.PORT || 9999);

const server = createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD', 'Content-Length': 0 });
    response.end();
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  }
  catch {
    response.writeHead(400, { 'Content-Length': 0 });
    response.end();
    return;
  }

  staticFiles(request, response, () => {
    // 和 watch 一样，只为页面导航返回错误页，避免把资源或 API 请求变成 HTML。
    const extension = extname(pathname).toLowerCase();
    const destination = request.headers['sec-fetch-dest'];
    const acceptsHtml = (request.headers.accept || '').split(',')
      .some((type) => type.trim().split(';')[0] === 'text/html');
    const isNavigation = destination === 'document' || destination === 'iframe' || (!destination && acceptsHtml);
    const isPage = !extension || extension === '.html' || extension === '.htm';
    const body = isNavigation && isPage ? notFound : undefined;

    response.statusCode = 404;
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Vary', 'Accept, Sec-Fetch-Dest');
    response.setHeader('Content-Length', body?.byteLength ?? 0);

    if (body) {
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
    }

    response.end(request.method === 'HEAD' ? undefined : body);
  });
});

server.listen(port, host, () => {
  const { port: listeningPort } = server.address();
  console.log(`Local:   http://localhost:${listeningPort}`);

  if (host === '0.0.0.0') {
    for (const addresses of Object.values(networkInterfaces())) {
      for (const address of addresses || []) {
        if (address.family === 'IPv4' && !address.internal) {
          console.log(`Network: http://${address.address}:${listeningPort}`);
        }
      }
    }
  }
  else {
    console.log(`Host:    http://${host}:${listeningPort}`);
  }
});
