import * as fs from 'fs';
import * as path from 'path';

import { CommandOptions, serve, devPort, log } from '../utils';
import { bundle, runBuild } from './build';

/** 输出文件缓存 */
const memory = new Map<string, Buffer>();
/** 正在编译标志 */
let compiling = false;

function writeMemory(assets: AssetData[]) {
  for (const file of assets) {
    memory.set(file.path, Buffer.from(file.content));
  }
}

function watchFiles(inputFiles: string[], opt: CommandOptions) {
  function unWatchFiles() {
    for (const file of inputFiles) {
      fs.unwatchFile(file);
    }
  }

  for (const file of inputFiles) {
    fs.watchFile(file, () => {
      log.log(`文件变更：${path.relative(process.cwd(), file)}`);
      unWatchFiles();
      build(opt);
    });
  }
}

async function build(opt: CommandOptions) {
  if (compiling) {
    return;
  }

  compiling = true;

  try {
    const bundled = await bundle(opt);

    if (bundled.errors.length > 0) {
      console.warn(bundled.errors[0]);
      return;
    }

    const assets = await runBuild(bundled.code);

    if (assets.error) {
      console.warn(assets.error);
      return;
    }

    await writeMemory(assets.files);

    compiling = false;
    log.log(`网站部署在 http://localhost:${devPort}`);

    watchFiles(bundled.watchFiles, opt);
  } catch (e: unknown) {
    log.warn(e);
  }
}

export async function watch(opt: CommandOptions) {
  build(opt);
  serve(devPort, memory);
}
