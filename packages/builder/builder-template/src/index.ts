import path from 'path';
import fs from 'fs';

import { build as esbuild } from 'esbuild';
import { JssLoader } from '@blog/esbuild-loader-jss';
import { ScriptLoader } from '@blog/esbuild-loader-script';
import { FileLoader } from '@blog/esbuild-loader-file';
import { assetNames, styleNames, scriptNames, publicPath } from '@blog/config';
import { mergeBuild, isDevelopment, getCliOptions } from '@blog/utils';

/** 选项数据结构 */
interface Options {
  name: string;
  input: string;
  loader?: Record<string, string>;
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
    JssLoader({ extractCss: false }).plugin,
    ScriptLoader({
      name: option.name,
      minify: !isDevelopment,
      styleNames,
      scriptNames,
    }).plugin,
  ];

  if (option.loader) {
    for (const loaderType of Object.keys(option.loader)) {
      const value = option.loader[loaderType];
      plugins.push(FileLoader({
        exts: value.split(','),
        type: loaderType as "text" | "binary",
      }));
    }
  }

  esbuild(mergeBuild({
    entryPoints: [option.input],
    outfile: outFile,
    minify: false,
    write: true,
    bundle: true,
    watch: isDevelopment,
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
    .catch((e) => {
      console.error(e.message);
    });
}
