import path from 'path';
import esbuild from 'esbuild';

import { PostLoader } from './plugins/loader-post';
import { JssLoader } from './plugins/loader-jss';
import { ScriptLoader } from './plugins/loader-script';
import { AssetLoader } from './plugins/loader-asset';
import { runScript } from '@xiao-ai/utils/node';
import { cache } from './context';
import { getExternalPkg, CacheVarName } from './utils';
import { scriptNames, styleNames, assetNames, CommandOptions } from '../utils';

// import cliSpinners from 'cli-spinners';

async function bundle(opt: CommandOptions) {
  const start = Date.now();
  const result = await esbuild
    .build({
      bundle: true,
      write: false,
      outdir: path.join(process.cwd(), opt.outDir),
      entryPoints: [path.join(__dirname, '../../', 'src/builder/index.ts')],
      platform: 'node',
      sourcemap: false,
      publicPath: '/',
      minify: opt.mode === 'production',
      external: await getExternalPkg(),
      mainFields: ['source', 'module', 'main'],
      assetNames,
      loader: {
        '.ttf': 'file',
        '.woff': 'file',
        '.woff2': 'file',
        '.svg': 'file',
      },
      plugins: [
        PostLoader(),
        AssetLoader({
          exts: ['ico', 'plist', '.wasm'],
          cache,
        }),
        JssLoader({ extractCss: false }).plugin,
        ScriptLoader({
          styleNames,
          scriptNames,
          cache,
        }).plugin,
      ],
    })
    .catch((e: esbuild.BuildResult) => e);
  const end = Date.now();

  if (result.errors.length > 0) {
    console.warn(result.errors);
  }

  console.log(`打包耗时：${end - start} 毫秒`);

  return result.outputFiles?.[0].text ?? '';
}

function runBuild(code: string) {
  const start = Date.now();
  const result = runScript(code, {
    dirname: __dirname,
    globalParams: {
      [CacheVarName]: cache,
      process,
    },
  });
  const end = Date.now();

  console.log(`运行耗时：${end - start} 毫秒`);

  if (result.error) {
    throw result.error;
  }

  return result.output() as AssetData[];
}

export async function build(opt: CommandOptions) {
  const bundledCode = await bundle(opt);
  const result = await runBuild(bundledCode);

  console.log(result.length);
  debugger;
}
