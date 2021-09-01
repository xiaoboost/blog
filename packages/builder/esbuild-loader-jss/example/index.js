const esbuild = require('esbuild');
const path = require('path');
const { JssLoader } = require('../dist');

async function main() {
  console.time('build');

  await esbuild.build({
    entryPoints: [path.join(__dirname, './index.ts')],
    outdir: path.join(__dirname, 'dist'),
    bundle: true,
    minify: false,
    write: true,
    watch: false,
    format: 'iife',
    assetNames: '/assets/[name].[hash]',
    publicPath: '/',
    loader: {
      '.svg': 'file',
    },
    plugins: [
      JssLoader(),
    ],
  }).catch((e) => {
    console.error(e.message)
  });

  console.timeEnd('build');
}

main();
