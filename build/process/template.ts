import { build, OutputFile } from 'esbuild';
import { outputDir, assetsPath } from '../config/project';
import { stylusLoader, moduleCssLoader } from '../plugins';
import { runScript, resolveRoot, isDevelopment, isWatch } from '../utils';
import { mergeConfig, fileExts } from './utils';
import { externals } from './post';

import type * as TemplateRender from '@template';

import * as files from './files';
import * as path from 'path';

import md5 from 'md5';

export type Template = typeof TemplateRender;

function fixFile(outputFiles: OutputFile[]) {
  for (const file of outputFiles) {
    const ext = path.extname(file.path);
    const fileName = path.basename(file.path);

    if (fileExts.includes(ext)) {
      file.path = path.join(outputDir, assetsPath, fileName);
      files.push(file);
    }
    else if (fileName.includes('index.css')) {
      const name = isDevelopment
        ? `/css/style.css`
        : `/css/style.${md5(file.contents)}.css`;

      file.path = path.join(outputDir, name);
      files.push(file);
    }
  }
}

function getTemplate(outputFiles: OutputFile[]) {
  const codeFile = (outputFiles!).find((item) => /index\.js$/.test(item.path));
  const code = Buffer.from(codeFile?.contents ?? '').toString();

  externals.styles = (outputFiles)
    .filter((file) => /\.css$/.test(file.path))
    .map((file) => path.relative(outputDir, file.path));

  externals.scripts = [];

  if (!codeFile || !code) {
    throw new Error('Create template render script Error.');
  }

  return runScript(code);
}

export async function buildTemplate() {
  const result = await build(mergeConfig({
    entryPoints: ['./template/index.ts'],
    watch: false,
    outdir: resolveRoot('dist'),
    plugins: [
      stylusLoader(),
      moduleCssLoader(),
    ],
  })).catch((e) => {
    const message = JSON.stringify(e, null, 2);
    console.error(message);
    throw JSON.stringify(e, null, 2);
  });

  fixFile(result.outputFiles!);

  return getTemplate(result.outputFiles ?? []);
}
