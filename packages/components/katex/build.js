const path = require('path');
const { build } = require('esbuild');
const { ScriptLoader } = require('@blog/esbuild-loader-script');

build({
  entryPoints: [path.join(__dirname, './src/index.tsx')],
  outdir: path.join(__dirname, './dist'),
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
  debugger;
  console.log(e);
});
