import Chalk from 'chalk';

import { cname } from './cname';
import { write } from './files';
import { serve } from '../server';
import { buildPost } from './post';
import { buildTemplate } from './template';
import { isProduction, isServer } from '../utils';
import { devPort, outputDir } from '../config/project';

export async function build() {
  await cname();

  const template = await buildTemplate();

  await buildPost(template);
  await write();

  if (isServer) {
    serve(outputDir, devPort);
  }
  else if (isProduction) {
    console.log(Chalk.blueBright(` ⚡ Compilation done.`));
  }
}
