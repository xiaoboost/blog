const path = require('path');
const { build } = require('esbuild');
const { ScriptLoader } = require('@blog/esbuild-loader-script');
const isProduction = process.argv.includes('--production');
const isWatch = process.argv.includes('--watch');

build({
  entryPoints: [path.join(__dirname, './src/main.script.ts')],
  outfile: path.join(__dirname, './dist/assets.js'),
  bundle: true,
  minify: true,
  write: true,
  watch: isWatch,
  mainFields: ['source', 'module', 'main'],
  assetNames: isProduction
    ? '/assets/[name].[hash]'
    : '/assets/[name]',
  publicPath: '/',
  format: 'cjs',
  loader: {
    '.ttf': 'file',
    '.woff': 'file',
    '.woff2': 'file',
  },
  external: ['react', 'katex'],
  define: {
    'process.env.NODE_ENV': isProduction ? `'production'` : `'development'`,
  },
  plugins: [
    ScriptLoader({
      name: 'katex',
    }).plugin,
  ],
}).catch((e) => {
  console.error(e.message);
});
