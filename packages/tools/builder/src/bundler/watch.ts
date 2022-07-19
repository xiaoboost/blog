import * as path from 'path';

import chokidar from 'chokidar';

import { WatchCommandOptions, devPort, log } from '../utils';
import { bundle, runBuild } from './build';
import { printEsbuildError } from './utils';
import { DevServer } from './dev';

/** 输出文件缓存 */
const memory = new Map<string, Buffer>();
/** 文件监听器 */
const watcher = chokidar.watch([]);
/** 正在编译标志 */
let compiling = false;

function writeMemory(assets: AssetData[]) {
  for (const file of assets) {
    memory.set(file.path, Buffer.from(file.content));
  }
}

function watchFiles(inputFiles: string[], opt: WatchCommandOptions, server: DevServer) {
  const eventName = 'change';

  if (watcher.listenerCount(eventName) === 0) {
    watcher.addListener(eventName, (file: string) => {
      log.log(`文件变更：${path.relative(process.cwd(), file)}`);
      build(opt, server);
    });
  }

  watcher.add(inputFiles);
}

async function build(opt: WatchCommandOptions, server: DevServer) {
  if (compiling) {
    return;
  }

  compiling = true;

  try {
    const bundled = await bundle({
      ...opt,
      outDir: '/',
    });

    if (bundled.errors.length > 0) {
      printEsbuildError(bundled.errors);
      return;
    }

    const assets = await runBuild(bundled.code);

    if (assets.error) {
      console.warn(assets.error);
      return;
    }

    await writeMemory(assets.files);

    server.start();
    compiling = false;

    log.log(`网站部署在 http://localhost:${devPort}\n`);

    watchFiles(bundled.watchFiles, opt, server);
  } catch (e: unknown) {
    log.warn(e);
  }
}

export async function watch(opt: WatchCommandOptions) {
  const server = new DevServer(memory, {
    port: devPort,
    hmr: opt.hmr,
  });

  build(opt, server);
}
