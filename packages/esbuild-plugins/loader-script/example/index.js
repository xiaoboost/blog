const esbuild = require('esbuild');
const path = require('path');
const { mkdirp } = require('@blog/utils');
const { promises: fs } = require('fs');
const { ScriptLoader } = require('../dist');

async function main() {
  console.time('build');
  const result = await esbuild.build({
    entryPoints: [path.join(__dirname, './index.ts')],
    outdir: path.join(__dirname, './dist'),
    outbase: '',
    bundle: true,
    minify: true,
    write: false,
    watch: false,
    format: 'iife',
    plugins: [
      ScriptLoader({
        name: 'example[hash][ext]',
      }),
    ],
  }).catch((e) => {
    debugger;
  });

  console.timeEnd('build');

  for (const file of ScriptLoader.output()) {
    await mkdirp(path.dirname(file.path), {}, fs);
    await fs.writeFile(file.path, file.contents);
  }

  console.log(result);
}

main();
