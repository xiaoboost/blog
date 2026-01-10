import type { BuilderInstance } from '@blog/types';
import { ParameterizedContext, Next } from 'koa';
import { join } from 'path';
import { HMRClientScriptPath } from '@blog/shared';
import { BuildContext, BuildResult, context } from 'esbuild';
import { getCoreRoot } from '../../../utils';

export function transformServe(vfs: Map<string, Buffer>, builder: BuilderInstance) {
  let instance: BuildContext;
  let buildResult: BuildResult;

  builder.hooks.done.tap('develop-transform', () => {
    instance?.dispose?.();
  });

  return async (ctx: ParameterizedContext, next: Next) => {
    if (ctx.path !== HMRClientScriptPath) {
      return next();
    }

    const clientPath = join(getCoreRoot(), 'src/plugins/development/runtime/client.ts');

    if (instance) {
      buildResult = await instance.rebuild();
    } else {
      instance = await context({
        entryPoints: [clientPath],
        bundle: true,
        minify: false,
        sourcemap: 'inline',
        write: false,
        format: 'iife',
        outdir: '/',
        platform: 'browser',
        logLevel: 'silent',
        charset: 'utf8',
      });
    }

    const file = buildResult.outputFiles?.[0]?.contents;

    if (file) {
      vfs.set(HMRClientScriptPath, Buffer.from(file));
    } else {
      throw new Error('未能生成文件');
    }

    return next();
  };
}
