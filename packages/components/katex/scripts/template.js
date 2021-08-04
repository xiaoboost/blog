const { build } = require('esbuild');
const { resolve, packageData, templateFile } = require('./utils');
const { mergeBuild, isDevelopment } = require('@blog/utils');

build(mergeBuild({
  entryPoints: [resolve('src/index.tsx')],
  outfile: templateFile,
  minify: false,
  sourcemap: true,
  watch: isDevelopment,
  assetNames: isDevelopment ? '/assets/[name]' : '/assets/[name].[hash]',
  external: Object.keys(packageData.dependencies).concat(Object.keys(packageData.devDependencies)),
})).catch((e) => {
  console.error(e.message);
});
