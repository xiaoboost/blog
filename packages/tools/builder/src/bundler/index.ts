import path from 'path';
import esbuild from 'esbuild';
import fs from 'fs-extra';

import { PostLoader } from './plugins/loader-post';
import { JssLoader } from './plugins/loader-jss';
import { ScriptLoader } from './plugins/loader-script';
import { AssetLoader } from './plugins/loader-asset';
import { runScript } from '@xiao-ai/utils/node';
import { cache } from './context';
import { getExternalPkg, CacheVarName, log } from './utils';
import { scriptNames, styleNames, assetNames, CommandOptions } from '../utils';

async function bundle(opt: CommandOptions) {
  log.loadStart('代码打包...');
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

  await new Promise((resolve) => setTimeout(resolve, 5000));

  log.loadEnd();
  log.log(`打包耗时：${end - start} 毫秒`);

  return result.outputFiles?.[0].text ?? '';
}

function runBuild(code: string) {
  log.loadStart('运行构建...');
  const start = Date.now();
  const result = runScript(code, {
    dirname: __dirname,
    globalParams: {
      [CacheVarName]: cache,
      process,
    },
  });
  const end = Date.now();

  log.loadEnd();
  log.log(`运行耗时：${end - start} 毫秒`);

  if (result.error) {
    throw result.error;
  }

  return result.output() as AssetData[];
}

async function writeDisk(assets: AssetData[], outDir: string) {
  await fs.remove(outDir);

  await Promise.all(
    assets.map(async (file) => {
      const fullPath = path.join(outDir, file.path);
      const dir = path.dirname(fullPath);

      await fs.mkdirp(dir);
      await fs.writeFile(fullPath, file.content);
    }),
  );
}

export async function build(opt: CommandOptions) {
  const bundledCode = await bundle(opt);
  const assets = await runBuild(bundledCode);
  const outDir = path.join(process.cwd(), opt.outDir);

  await writeDisk(assets, outDir);

  log.log('网站生成完毕');
}
