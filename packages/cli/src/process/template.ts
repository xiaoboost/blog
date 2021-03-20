import { build } from 'esbuild';
import { dirname } from 'path';
import { mergeConfig } from '../utils/esbuild';

async function buildTemplate() {
  const result = await build(mergeConfig({
    write: false,
    minify: false,
    jsxFactory: 'react',
    stdin: {
      contents: `export * from '@blog/template';`,
      resolveDir: dirname(__dirname),
      sourcefile: 'template.ts',
      loader: 'ts',
    },
  }));

  debugger;
  return result;
}

export async function transform() {
  return buildTemplate();
}
