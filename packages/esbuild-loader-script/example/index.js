const esbuild = require('esbuild');
const path = require('path');
const { ScriptLoader } = require('../dist');

async function main() {
  console.time('build');

  await esbuild.build({
    entryPoints: [path.join(__dirname, './index.ts')],
    outdir: path.join(__dirname, './dist'),
    bundle: true,
    minify: true,
    write: true,
    watch: false,
    assetNames: '/assets/[name]',
    publicPath: '/',
    format: 'cjs',
    plugins: [
      ScriptLoader({
        name: 'test',
        outDir: 'static',
        scriptDir: 'scripts',
        styleDir: 'styles',
      }),
    ],
  }).catch((e) => {
    console.error(e.message)
  });

  console.timeEnd('build');
}

main();
