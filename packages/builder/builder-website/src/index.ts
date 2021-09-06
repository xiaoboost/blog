import path from 'path';
import rm from 'rmrf';

import { fs as mfs } from 'memfs';
import { build as esbuild, BuildResult } from 'esbuild';
import { promises as fs, readFileSync } from 'fs';
import { mergeBuild, runScript, getCliOptions, AssetData, serve } from '@blog/utils';

interface Options {
  outDir: string;
  internal?: string;
  development?: boolean;
}

let isServerSet = false;

const option = getCliOptions<Options>();
const input = path.join(__dirname, '../bundler/index.ts');
const output = path.join(process.cwd(), option.outDir);
const packageMatcher = /^@blog\/(posts|mdx|template)/;
const packageData = JSON.parse(readFileSync(path.join(__dirname, '../package.json'), 'utf-8'));
const external = (
  Object.keys(packageData.dependencies)
    .concat(Object.keys(packageData.devDependencies))
    .filter((name) => {
      // 不填表示全部包含
      if (!option.internal) {
        return !packageMatcher.test(name);
      }
      // 为`'none'`表示全部排除
      else if (option.internal === 'none') {
        return true;
      }
      // 指定包含
      else if (option.internal) {
        const packageName = name.replace(/^@blog\//, '');
        return !option.internal.split(',').includes(packageName);
      }
    })
);

// 检查必填项
['outDir'].forEach((key) => {
  if (!option[key]) {
    throw new Error(`没有找到指令'${key}'。`);
  }
});

async function writeDisk(files: AssetData[], vfs: typeof fs) {
  for (const file of files) {
    const filePath = path.join(output, file.path);
    await vfs.mkdir(path.dirname(filePath), { recursive: true });
    await vfs.writeFile(filePath, file.contents);
  }
}

async function finish(result?: BuildResult) {
  const code = result?.outputFiles?.[0].text ?? '';

  try {
    const build = runScript<() => Promise<AssetData[]>>(code, require, {
      __dirname,
    });
    const assets = await build();

    if (option.development) {
      await writeDisk(assets, mfs.promises as any);

      if (!isServerSet) {
        isServerSet = true;
        serve(output, 6535, mfs.promises as any);
      }
    }
    else {
      await rm(output);
      await writeDisk(assets, fs);
    }
  }
  catch (e: any) {
    console.error(e.message);
  }
}

export async function build() {
  const result = await esbuild(mergeBuild({
    entryPoints: [input],
    minify: false,
    write: false,
    outfile: 'index.js',
    platform: 'node',
    logLevel: 'error',
    watch: !option.development ? false : {
      onRebuild(err, result) {
        if (err) {
          console.error(err.message);
          return;
        }

        if (result) {
          finish(result);
        }
      },
    },
    external,
  }))
    .catch((e) => {
      console.error(e.message);
    });

  await finish(result!);
}
