import path from 'path';
import fs from 'fs';

import { isFunc } from '@xiao-ai/utils';
import { load, serve } from '@blog/server';
import { mergeBuild, isDevelopment, runScript, getCliOption } from '@blog/utils';

import posts from '@blog/posts';

const outDir = path.join(process.cwd(), getCliOption('outDir'));

export function build() {
  console.log('build');
}
