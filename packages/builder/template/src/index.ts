import path from 'path';
import fs from 'fs';

import { isFunc } from '@xiao-ai/utils';
import { load, serve } from '@blog/server';
import { build as esbuild, BuildResult } from 'esbuild';
import { ScriptLoader } from '@blog/esbuild-loader-script';
import { mergeBuild, isDevelopment, runScript } from '@blog/utils';

const root = process.cwd();
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

function getInput() {
  if (!process.argv[2]) {
    console.warn('必须要输入入口文件路径');
    process.exit(1);
  }

  return resolve(process.argv[2]);
}

function getOutput() {
  if (!packageData.main) {
    console.warn('package.json 文件的必须要有 main 字段');
    process.exit(1);
  }

  return resolve(packageData.main);
}

export function build() {
  const inputFile = getInput();
  const outFile = getOutput();

  esbuild(mergeBuild({
    entryPoints: [inputFile],
    outfile: outFile,
    minify: false,
    logLevel: 'info',
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
    plugins: [
      ScriptLoader({
        name: 'katex',
        minify: !isDevelopment,
      }).plugin,
    ],
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
