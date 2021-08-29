import path from 'path';
import fs from 'fs';

import { isFunc, isArray } from '@xiao-ai/utils';
import { load, serve } from '@blog/server';
import { build as esbuild, BuildResult } from 'esbuild';
import { JssLoader } from '@blog/esbuild-loader-jss';
import { ScriptLoader } from '@blog/esbuild-loader-script';
import { FileLoader } from '@blog/esbuild-loader-file';
import { assetNames, publicPath } from '@blog/config';
import { mergeBuild, isDevelopment, runScript, getCliOptions } from '@blog/utils';

/** 选项数据结构 */
interface Options {
  name: string;
  input: string;
  loader?: Record<string, string | string[]>;
}

const root = process.cwd();
const option = getCliOptions<Options>();
const packageData = JSON.parse(fs.readFileSync(resolve('package.json'), 'utf-8'));

// 检查必填项
['input', 'name'].forEach((key) => {
  if (!option[key]) {
    throw new Error(`没有找到指令'${key}'。`);
  }
});

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
    ScriptLoader({ name: option.name, minify: !isDevelopment }).plugin,
    JssLoader({ extractCss: false }).plugin,
  ];

  if (option.loader) {
    for (const loaderType of Object.keys(option.loader)) {
      const value = option.loader[loaderType];
      plugins.push(FileLoader({
        exts: isArray(value) ? value : [value],
        type: loaderType as "text" | "binary",
      }));
    }
  }

  esbuild(mergeBuild({
    entryPoints: [option.input],
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
    publicPath,
    assetNames,
    external: Object.keys(packageData.dependencies)
      .concat(Object.keys(packageData.devDependencies)),
    loader: {
      '.svg': 'dataurl',
    },
    define: {
      'process.env.ModuleName': `"${packageData.name}"`,
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
