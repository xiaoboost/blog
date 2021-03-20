import { build } from 'esbuild';
import { dirname } from 'path';
import { isDevelopment } from '../utils/env';
import { resolveRoot } from '../utils/path';
import { stylusLoader, fontLoader, moduleCssLoader } from '../utils/esbuild';

import type * as Template from '@blog/template';

function runScript(script: string): typeof Template {
  interface FakeModule {
    exports: {
      default: any;
      [key: string]: any;
    }
  }

  const fake: FakeModule = {
    exports: {},
  } as any;

  try {
    (new Function(`
      return function box(module, exports, require) {
        ${script}
      }
    `))()(fake, fake.exports, require);
  }
  catch (e) {
    throw new Error(e);
  }

  return fake.exports as any;
}

export async function buildTemplate(finish?: (template: typeof Template) => void) {
  const result = await build({
    write: false,
    minify: false,
    sourcemap: false,
    external: ['pinyin', 'esbuild'],
    mainFields: ["source", "module", "main"],
    watch: false,
    platform: 'node',
    format: 'cjs',
    bundle: true,
    outdir: resolveRoot('dist'),
    treeShaking: true,
    publicPath: 'font',
    logLevel: 'warning',
    define: {
      ["process.env.NODE_ENV"]: isDevelopment
        ? '"development"'
        : '"production"',
    },
    loader: {
      '.eot': 'file',
      '.otf': 'file',
      '.svg': 'file',
      '.ttf': 'file',
      '.woff': 'file',
      '.woff2': 'file',
    },
    plugins: [
      stylusLoader(),
      fontLoader(),
      moduleCssLoader(),
    ],
    stdin: {
      contents: `export * from '@blog/template';`,
      resolveDir: dirname(__dirname),
      sourcefile: 'template.ts',
      loader: 'ts',
    },
  }).catch((e) => {
    debugger;
    throw e;
  });

  debugger;
  let code = Buffer.from(result?.outputFiles?.[0].contents ?? '').toString();

  if (!code) {
    throw new Error('Create template Error.');
  }
  
  // 去除 pinyin 的依赖
  code = code.replace('require("pinyin")', '{}');

  return runScript(code);
}
