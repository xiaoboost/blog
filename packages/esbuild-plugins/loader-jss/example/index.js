const esbuild = require('esbuild');
const path = require('path');
const { JssLoader } = require('../dist');

async function main() {
  console.time('build');
  const result = await esbuild.build({
    entryPoints: [path.join(__dirname, './index.ts')],
    outdir: path.join(__dirname, 'dist'),
    bundle: true,
    minify: false,
    write: true,
    watch: false,
    format: 'iife',
    plugins: [
      JssLoader(),
    ],
  }).catch((e) => {
    debugger;
  });

  console.timeEnd('build');
  console.log(result);
}

main();
