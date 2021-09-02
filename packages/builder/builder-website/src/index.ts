import path from 'path';
import rm from 'rmrf';

import { build as esbuild } from 'esbuild';
import { promises as fs, readFileSync } from 'fs';
import { mergeBuild, runScript, getCliOptions, AssetData } from '@blog/utils';

interface Options {
  outDir: string;
  development?: boolean;
}

const option = getCliOptions<Options>();
const input = path.join(__dirname, '../bundler/index.ts');
const output = path.join(process.cwd(), option.outDir);
const packageData = JSON.parse(readFileSync(path.join(__dirname, '../package.json'), 'utf-8'));

// 检查必填项
['outDir'].forEach((key) => {
  if (!option[key]) {
    throw new Error(`没有找到指令'${key}'。`);
  }
});

async function writeDisk(files: AssetData[]) {
  for (const file of files) {
    const filePath = path.join(output, file.path);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, file.contents);
  }
}

async function finish(code: string) {
  try {
    const assets = runScript(code, require);

    if (option.development) {
      // ..
    }
    else {
      await rm(output);
      await writeDisk(assets);
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
    external: Object.keys(packageData.dependencies)
      .concat(Object.keys(packageData.devDependencies)),
  }))
    .catch((e) => {
      console.error(e.message);
    });

  await finish(result?.outputFiles?.[0].text ?? '');
}
