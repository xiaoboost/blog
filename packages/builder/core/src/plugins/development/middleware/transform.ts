import { ParameterizedContext, Next } from 'koa';
import { join } from 'path';
import { HMRClientScriptPath } from '@blog/shared';
import { build, BuildIncremental } from 'esbuild';
import { getCoreRoot } from '../../../utils';

export function transformServe(vfs: Map<string, Buffer>) {
  let instance: BuildIncremental;

  return async (ctx: ParameterizedContext, next: Next) => {
    if (ctx.path !== HMRClientScriptPath) {
      return next();
    }

    const clientPath = join(getCoreRoot(), 'src/plugins/development/runtime/client.ts');

    if (instance) {
      instance = await instance.rebuild();
    } else {
      instance = (await build({
        entryPoints: [clientPath],
        bundle: true,
        minify: false,
        sourcemap: 'inline',
        write: false,
        format: 'iife',
        outdir: '/',
        incremental: true,
        platform: 'browser',
        logLevel: 'silent',
        charset: 'utf8',
      })) as BuildIncremental;
    }

    const file = instance.outputFiles?.[0]?.contents;

    if (file) {
      vfs.set(HMRClientScriptPath, Buffer.from(file));
    } else {
      throw new Error('未能生成文件');
    }

    return next();
  };
}
