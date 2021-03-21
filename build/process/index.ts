import { write } from './files';
import { serve } from '../server';
import { buildPost } from './post';
import { buildTemplate, Template } from './template';
import { isProduction, isServer, isWatch, print } from '../utils';
import { devPort, outputDir } from '../config/project';
import { watch as watchFiles, WatchOptions } from 'chokidar';

export async function build() {
  print.Doing();

  let template: Template

  // 完整编译
  async function allBuild() {
    template = await buildTemplate();
    await buildPost(template);
    await endBuild();
  }

  // 文本编译
  async function postBuild() {
    await buildPost(template);
    await endBuild();
  }

  // 结束编译
  async function endBuild() {
    await write();

    if (isServer) {
      print.Serve(devPort);
    }
    else if (isProduction) {
      print.Done();
    }
  }

  await allBuild();

  if (isServer) {
    serve(outputDir, devPort);
  }

  if (isWatch) {
    const opt: WatchOptions = {
      interval: 300,
    };

    watchFiles('./template', opt).on('change', () => {
      print.Doing();
      allBuild();
    });

    watchFiles(['./posts'], opt).on('change', () => {
      print.Doing();
      postBuild();
    });
  }
}
