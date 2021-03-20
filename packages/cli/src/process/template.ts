import { build, OutputFile } from 'esbuild';
import { isDevelopment } from '../utils/env';
import { resolveRoot } from '../utils/path';
import { outputDir, publicPath, assetsPath } from '../config/project';
import { stylusLoader, moduleCssLoader } from '../utils/esbuild';

import type * as Template from '@blog/template';

import * as files from './files';
import * as path from 'path';

import md5 from 'md5';

/** 静态文件后缀 */
const fileExts = ['.eot', '.otf', '.svg', '.ttf', '.woff', '.woff2', '.ico'];

function runScript(script: string) {
  // 去除 pinyin 的依赖
  const code = script.replace('require("pinyin")', '{}');

  interface FakeModule {
    exports: {
      default: any;
    }
  }

  const fake: FakeModule = {
    exports: {},
  } as any;

  try {
    (new Function(`
      return function box(module, exports, require) {
        ${code}
      }
    `))()(fake, fake.exports, require);
  }
  catch (e) {
    throw new Error(e);
  }
  
  return (fake.exports.default ? fake.exports.default : fake.exports) as typeof Template;
}

function fixFile(outputFiles: OutputFile[]) {
  for (const file of outputFiles) {
    const ext = path.extname(file.path);
    const fileName = path.basename(file.path);

    if (fileExts.includes(ext)) {
      file.path = path.join(outputDir, assetsPath, fileName);
      files.push(file);
    }
    else if (ext === '.css') {
      const name = process.env.NODE_ENV === 'production'
        ? `/css/style.${md5(file.contents)}.css`
        : `/css/style.${md5(file.contents)}.css`;

      file.path = path.join(outputDir, name);
      files.push(file);
    }
  }
}

export async function buildTemplate(finish?: (template: typeof Template) => void) {
  const result = await build({
    write: false,
    minify: !isDevelopment,
    sourcemap: false,
    external: ['pinyin', 'esbuild'],
    mainFields: ["source", "module", "main"],
    watch: false,
    platform: 'node',
    format: 'cjs',
    bundle: true,
    outdir: resolveRoot('dist'),
    treeShaking: true,
    publicPath: path.join(publicPath, assetsPath),
    logLevel: 'warning',
    define: {
      ["process.env.NODE_ENV"]: isDevelopment
        ? '"development"'
        : '"production"',
    },
    loader: Object.fromEntries(
      fileExts
        .map((ext) => [ext, 'file'])
    ),
    plugins: [
      stylusLoader(),
      moduleCssLoader(),
    ],
    stdin: {
      contents: `export * from '@blog/template';`,
      resolveDir: path.dirname(__dirname),
      sourcefile: 'template.ts',
      loader: 'ts',
    },
  }).catch((e) => {
    const message = JSON.stringify(e, null, 2);
    console.error(message);
    throw JSON.stringify(e, null, 2);
  });

  fixFile(result.outputFiles!);

  const codeFile = (result.outputFiles!).find((item) => /\.js$/.test(item.path));
  const code = Buffer.from(codeFile?.contents ?? '').toString();

  if (!codeFile || !code) {
    throw new Error('Create template render script Error.');
  }

  return runScript(code);
}
