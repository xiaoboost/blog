import Glob from 'fast-glob';
import path from 'path';

import { resolveRoot, runScript, isWatch } from '../utils';
import { build, StdinOptions, BuildResult } from 'esbuild';
import { mdLoader, PostData } from '../plugins';
import { outputDir } from '../config/project';
import { mergeConfig } from './utils';

import * as files from './files';
import * as renderer from './renderer';

import type { Template } from './template';

export interface ExternalFile {
  styles: string[];
  scripts: string[];
}

export const externals: ExternalFile = {
  styles: [],
  scripts: [],
};

async function createPostIndex(): Promise<StdinOptions> {
  const files = await Glob('./posts/**/*.md');

  let importStr = '';
  let exportStr = '';

  for (let i = 0; i < files.length; i++) {
    importStr += `import post${i} from '${files[i]}';\n`;
    exportStr += `  post${i},\n`;
  }

  return {
    contents: `${importStr}\nexport default [\n${exportStr}];\n`,
    resolveDir: resolveRoot(),
    sourcefile: 'index.ts',
    loader: 'ts',
  };
}

function createSite(result: BuildResult, template: Template) {
  const codeFile = (result.outputFiles ?? []).find((item) => /\.js$/.test(item.path));
  const code = Buffer.from(codeFile?.contents ?? '').toString();

  if (!code) {
    throw new Error('Create template render script Error.');
  }

  const origins = runScript<PostData[]>(code).map((post) => ({
    ...post,
    ...externals,
  }));
  const posts = renderer.posts(origins, template);

  files.push(...posts.map((post) => ({
    path: path.join(outputDir, post.pathname, 'index.html'),
    contents: post.html,
  })));

  files.push(...renderer.index(posts, externals, template));
}

export async function buildPost(template: Template) {
  const create = (result: BuildResult) => createSite(result, template);
  const result = await build(mergeConfig({
    watch: false,
    outdir: resolveRoot('dist'),
    stdin: await createPostIndex(),
    plugins: [
      mdLoader(),
    ],
  })).catch((e) => {
    const message = JSON.stringify(e, null, 2);
    console.error(message);
  });

  if (result) {
    create(result);
  }
}
