const { build } = require('esbuild');
const { resolve, assetFile } = require('./utils');
const { mergeBuild, isDevelopment } = require('@blog/utils');
const { ScriptLoader } = require('@blog/esbuild-loader-script');

build(mergeBuild({
  entryPoints: [resolve('src/main.script.ts')],
  outfile: assetFile,
  minify: true,
  sourcemap: false,
  watch: isDevelopment,
  external: ['react', 'katex'],
  assetNames: isDevelopment ? '/assets/[name]' : '/assets/[name].[hash]',
  plugins: [
    ScriptLoader({
      name: 'katex',
    }).plugin,
  ],
})).catch((e) => {
  console.error(e.message);
});
