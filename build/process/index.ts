import { cname } from './cname';
import { write } from './files';
import { buildPost } from './post';
import { buildTemplate } from './template';
import { serve } from '../server';
import { devPort, outputDir } from '../config/project';

export async function build() {
  await cname();

  const template = await buildTemplate();
  
  await buildPost(template);
  await write();
  
  serve(outputDir, devPort);
}
