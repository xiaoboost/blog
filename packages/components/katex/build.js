const path = require('path');
const { build } = require('esbuild');
const { ScriptLoader } = require('@blog/esbuild-loader-script');

build({
  entryPoints: [path.join(__dirname, './src/main.script.ts')],
  outfile: path.join(__dirname, './dist/assets.js'),
  bundle: true,
  minify: true,
  write: true,
  watch: false,
  assetNames: '/assets/[name]',
  publicPath: '/',
  format: 'cjs',
  loader: {
    '.ttf': 'file',
    '.woff': 'file',
    '.woff2': 'file',
  },
  external: ['react', 'katex'],
  plugins: [
    ScriptLoader({
      name: 'katex',
    }),
  ],
}).catch((e) => {
  console.error(e);
});
