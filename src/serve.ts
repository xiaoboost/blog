// 调试模式
process.env.NODE_ENV = 'development';

import './loader';

import Koa from 'koa';

import * as fs from 'src/utils/memory-fs';

import { join } from 'path';
import { getType } from 'mime';
import { buildOutput as dist } from 'src/config/project';

const app = new Koa();

app.listen(6060);

app
    .use((ctx, next) => {
        if (ctx.method !== 'GET' && ctx.method !== 'HEAD') {
            ctx.status = 405;
            ctx.length = 0;
            ctx.set('Allow', 'GET, HEAD');
            next();
            return (false);
        }

        const filePath = ctx.path[ctx.path.length - 1] === '/'
            ? join(dist, ctx.path, 'index.html')
            : join(dist, ctx.path);

        if (!fs.existsSync(filePath)) {
            ctx.status = 404;
            ctx.length = 0;
            next();
            return (false);
        }

        ctx.type = getType(filePath)!;
        ctx.lastModified = new Date();

        ctx.set('Accept-Ranges', 'bytes');
        ctx.set('Cache-Control', 'max-age=0');

        ctx.length = Buffer.from(fs.readFileSync(filePath)).length;
        ctx.body = fs.createReadStream(filePath);

        next();
    });
