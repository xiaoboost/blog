import { ParameterizedContext, Next } from 'koa';
import { join } from 'path';
import { HMRClientScriptPath } from '@blog/shared/shared';
import { build } from 'esbuild';
import { getRoot } from '../../../utils';

export function transformServe(vfs: Map<string, Buffer>) {
  return async (ctx: ParameterizedContext, next: Next) => {
    if (ctx.path !== HMRClientScriptPath) {
      return next();
    }

    if (!vfs.has(ctx.path)) {
      const clientPath = join(getRoot(), 'src/bundler/dev/runtime/client.ts');
      const { outputFiles: files } = await build({
        entryPoints: [clientPath],
        bundle: true,
        minify: false,
        sourcemap: 'inline',
        write: false,
        format: 'iife',
        outdir: '/',
        platform: 'browser',
        logLevel: 'warning',
        charset: 'utf8',
      });

      vfs.set(HMRClientScriptPath, Buffer.from(files[0].contents));
    }

    return next();
  };
}
