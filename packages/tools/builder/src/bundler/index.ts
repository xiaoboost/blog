import path from 'path';
import esbuild from 'esbuild';

import { PostLoader } from './esbuild/loader-post';

export async function build() {
  const result = await esbuild.build({
    bundle: true,
    write: false,
    entryPoints: [path.join(__dirname, '../../', 'src/builder/index.ts')],
    platform: 'node',
    // sourcemap: true,
    minify: false,
    external: ['@blog/shared', 'react', '@mdx-js/react'],
    plugins: [PostLoader()],
  });
  debugger;
}
