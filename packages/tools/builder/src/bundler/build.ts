import path from 'path';
import esbuild from 'esbuild';
import fs from 'fs-extra';

import { BuildOptions, BuildResult } from 'esbuild';
import { PostLoader } from './plugins/loader-post';
import { JssLoader } from './plugins/loader-jss';
import { ScriptLoader } from './plugins/loader-script';
import { AssetLoader } from './plugins/loader-asset';
import { FileRecorder } from './plugins/record-file';
import { runScript } from '@xiao-ai/utils/node';
import { unique } from '@xiao-ai/utils';
import { cache } from './context';
import { getExternalPkg, CacheVarName } from './utils';
import { CommandOptions, log } from '../utils';

export async function bundle(opt: CommandOptions) {
  log.loadStart('代码打包...');

  const start = Date.now();
  const externals = await getExternalPkg();
  const isProduction = opt.mode === 'production';
  const fileRecorder = FileRecorder();
  const postLoader = PostLoader();
  const assetLoader = AssetLoader({
    exts: ['ico', 'plist', '.wasm'],
    cache,
  });
  const jssLoader = JssLoader({
    extractCss: false,
  });
  const scriptLoader = ScriptLoader({
    styleNames: isProduction ? 'styles/[name].[hash]' : 'styles/[name]',
    scriptNames: isProduction ? 'scripts/[name].[hash]' : 'scripts/[name]',
    cache,
  });
  const options: BuildOptions = {
    bundle: true,
    write: false,
    outdir: path.join(process.cwd(), opt.outDir),
    entryPoints: [path.join(__dirname, '../../', 'src/builder/index.ts')],
    platform: 'node',
    sourcemap: false,
    publicPath: '/',
    minify: isProduction,
    external: externals,
    mainFields: ['source', 'module', 'main'],
    assetNames: isProduction ? 'assets/[name].[hash]' : 'assets/[name]',
    loader: {
      '.ttf': 'file',
      '.woff': 'file',
      '.woff2': 'file',
      '.svg': 'file',
    },
    plugins: [
      assetLoader,
      postLoader.plugin,
      jssLoader.plugin,
      scriptLoader.plugin,
      fileRecorder.plugin,
    ],
  };
  const result = await esbuild.build(options).catch((e: BuildResult) => e);
  const end = Date.now();

  log.loadEnd();
  log.log(`打包耗时 ${end - start} 毫秒`);

  const watchFiles = unique(
    fileRecorder
      .getFiles()
      .concat(postLoader.getFiles(), jssLoader.getFiles(), scriptLoader.getFiles()),
  );

  return {
    watchFiles,
    errors: result.errors,
    code: result.outputFiles?.[0].text ?? '',
  };
}

export async function runBuild(code: string) {
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
  log.log(`运行耗时 ${end - start} 毫秒`);

  if (result.error) {
    throw result.error;
  }

  return {
    error: result.error as Error | undefined,
    files: (await result.output()) as AssetData[],
  };
}

export async function writeDisk(assets: AssetData[], outDir: string) {
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
  const bundled = await bundle(opt);

  if (bundled.errors.length > 0) {
    throw bundled.errors[0];
  }

  const assets = await runBuild(bundled.code);
  const outDir = path.join(process.cwd(), opt.outDir);

  if (assets.error) {
    throw assets.error;
  }

  await writeDisk(assets.files, outDir);

  log.log('网站生成完毕');
}
