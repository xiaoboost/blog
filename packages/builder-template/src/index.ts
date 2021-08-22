import path from 'path';
import fs from 'fs';

import { isFunc } from '@xiao-ai/utils';
import { load, serve } from '@blog/server';
import { build as esbuild, BuildResult } from 'esbuild';
import { ScriptLoader } from '@blog/esbuild-loader-script';
import { FileLoader } from '@blog/esbuild-loader-file';
import { mergeBuild, isDevelopment, runScript, getCliOption } from '@blog/utils';

const root = process.cwd();
const input = getCliOption('input');
const name = getCliOption('name');
const assetOptions = getCliOption('asset', false).split(',');
const packageData = JSON.parse(fs.readFileSync(resolve('package.json'), 'utf-8'));

function resolve(...paths: string[]) {
  return path.join(root, ...paths);
}

function watch(result: BuildResult | null | undefined) {
  const files = result?.outputFiles ?? [];

  if (!isDevelopment || files.length === 0) {
    return;
  }

  const jsFile = files.find((file) => path.extname(file.path) === '.js');
  const jsCode = jsFile?.text;

  if (!jsCode) {
    return;
  }

  const runResult = runScript(jsCode, require);

  if (isFunc(runResult.devApp)) {
    load(runResult.devApp(), runResult.assets);
  }
  else {
    console.error('入口文件必须含有名为\'devApp\'并返回 React.Node 的函数，用于调试');
  }
}

function getOutput() {
  if (!packageData.main) {
    console.warn('package.json 文件的必须要有 main 字段');
    process.exit(1);
  }

  return resolve(packageData.main);
}

export function build() {
  const outFile = getOutput();
  const plugins = [
    ScriptLoader({ name, minify: !isDevelopment }).plugin,
  ];

  if (assetOptions.length > 0) {
    plugins.push(FileLoader({
      files: assetOptions,
    }));
  }

  esbuild(mergeBuild({
    entryPoints: [input],
    outfile: outFile,
    minify: false,
    logLevel: 'info',
    platform: 'node',
    write: !isDevelopment,
    sourcemap: isDevelopment,
    watch: !isDevelopment ? false : {
      onRebuild(err, result) {
        if (err) {
          console.error(err.errors.map((er) => er.text));
          return;
        }

        watch(result);
      },
    },
    assetNames: isDevelopment ? '/assets/[name]' : '/assets/[name].[hash]',
    external: Object.keys(packageData.dependencies)
      .concat(Object.keys(packageData.devDependencies)),
    loader: {
      '.svg': 'dataurl',
    },
    define: {
      'process.env.ModuleName': `"${name}"`,
    },
    plugins,
  }))
    .then((data) => {
      if (isDevelopment) {
        watch(data);
        serve('/', 8080);
      }
    })
    .catch((e) => {
      console.error(e.message);
    });
}
