import path from 'path';

import { promises as fs } from 'fs';
import { build as esbuild } from 'esbuild';
import { mergeBuild, runScript, getCliOptions, AssetData } from '@blog/utils';

interface Options {
  outDir: string;
  development?: boolean;
}

const option = getCliOptions<Options>();
const input = path.join(__dirname, '../bundler/index.ts');
const output = path.join(process.cwd(), option.outDir);

// 检查必填项
['outDir'].forEach((key) => {
  if (!option[key]) {
    throw new Error(`没有找到指令'${key}'。`);
  }
});

async function write(files: AssetData[]) {
  for (const file of files) {
    const filePath = path.join(output, file.path);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, file.contents);
  }
}

async function finish(code: string) {
  try {
    const assets = runScript(code, require);

    debugger;
    if (option.development) {

    }
    else {
      await write(assets);
    }
  }
  catch(e) {
    debugger;
    console.error(e);
  }
}

export async function build() {
  const result = await esbuild(mergeBuild({
    entryPoints: [input],
    minify: false,
    write: false,
    outfile: 'index.js',
    platform: 'node',
    external: ['pinyin', 'typescript'],
  }))
    .catch((e) => {
      console.error(e.message);
    });

  await finish(result?.outputFiles?.[0].text ?? '');
}
