const path = require('path');
const { load, serve } = require('@blog/server');
const { build: esbuild } = require('esbuild');
const { ScriptLoader } = require('@blog/esbuild-loader-script');
const { mergeBuild, isDevelopment, runScript } = require('@blog/utils');
const { dependencies, devDependencies, main: outFile } = require('./package.json');

function resolve(...paths) {
  return path.join(__dirname, ...paths);
}

function watch(result) {
  const files = result?.outputFiles ?? [];

  if (!isDevelopment || files.length === 0) {
    return;
  }

  const jsFile = files.find((file) => path.extname(file.path) === '.js');
  const jsCode = jsFile?.text;

  if (!jsCode) {
    return;
  }

  const runResult = runScript(jsCode, require);
  load(runResult.devApp(), runResult.assets);
}

function build() {
  esbuild(mergeBuild({
    entryPoints: [resolve('src/index.tsx')],
    outfile: resolve(outFile),
    minify: false,
    logLevel: 'info',
    write: !isDevelopment,
    sourcemap: isDevelopment,
    watch: !isDevelopment ? false : {
      onRebuild(err, result) {
        if (err) {
          console.error(err.errors.map((er) => er.text));
          return;
        }

        watch(result);
      },
    },
    assetNames: isDevelopment ? '/assets/[name]' : '/assets/[name].[hash]',
    external: Object.keys(dependencies).concat(Object.keys(devDependencies)),
    plugins: [
      ScriptLoader({ name: 'katex' }).plugin,
    ],
  }))
    .then((data) => {
      if (isDevelopment) {
        watch(data);
        serve('/', 8080);
      }
    })
    .catch((e) => {
      console.error(e.message);
    });
}

build();
