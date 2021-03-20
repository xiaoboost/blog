import Glob from 'fast-glob';
import path from 'path';

import { resolveRoot } from '../utils';
import { build, StdinOptions } from 'esbuild';

export async function createPostIndex(): Promise<StdinOptions> {
  const files = await Glob(resolveRoot('posts/**/*.md'));

  let importStr = '';
  let exportStr = '';

  for (let i = 0; i < files.length; i++) {
    importStr += `import post${i} from '${files[i]}';\n`;
    exportStr += `  post${i},\n`;
  }

  return {
    contents: `${importStr}\nexport default [\n${exportStr}];\n`,
    resolveDir: resolveRoot('posts'),
    sourcefile: 'index.ts',
    loader: 'ts',
  };
}
