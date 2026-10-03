/* eslint-disable @typescript-eslint/no-require-imports -- 隔离子进程使用 CommonJS 加载真实 Runner。 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const inspector = require('node:inspector');
const { createRequire } = require('node:module');
const os = require('node:os');
const path = require('node:path');
const { fileURLToPath, pathToFileURL } = require('node:url');
const { buildSync } = require('esbuild');
const { SourceMapConsumer } = require('source-map');
const { Runner } = require('../../runner/runner.ts');

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-runner-map-'));
const root = path.join(tempRoot, '博客 # source space');
const sourcePath = path.join(root, '原始 代码 #.ts');
const runtimeDir = path.resolve(__dirname, '../../runner');
const runtimeFile = path.join(runtimeDir, 'virtual-san-box.js');
const cacheDir = path.join(root, '.cache', 'debug');
const builder = {
  root,
  name: 'Source map test',
  options: { root, cache: '.cache', terminalColor: false, logLevel: 'Silence' },
  logger: { error: (message) => {
    throw new Error(message);
  } },
};
const session = new inspector.Session();
const scripts = [];
let openedInspector = false;

function post(method, params = {}) {
  return new Promise((resolve, reject) => {
    session.post(method, params, (error, result) => error ? reject(error) : resolve(result));
  });
}

function bundle(value) {
  const originalSource = [
    '// runner-source-map-probe',
    `const value: number = ${value};`,
    'module.exports = { value, dirname: __dirname, filename: __filename, chalkPath: require.resolve("chalk") };',
    '',
  ].join('\n');
  fs.writeFileSync(sourcePath, originalSource);
  const output = buildSync({
    absWorkingDir: root,
    entryPoints: [sourcePath],
    outfile: path.join(root, 'virtual', '__bundleFile.js'),
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
    sourcemap: 'external',
    sourcesContent: true,
    logLevel: 'silent',
  }).outputFiles;
  const source = output.find((file) => file.path.endsWith('.js'));
  const map = output.find((file) => file.path.endsWith('.js.map'));
  const sourceMap = JSON.parse(map.text);
  // 虚拟模块有自身的生成代码，不能误认为磁盘上的 MDX 原稿。
  sourceMap.sources.push('mdx-loader:/virtual/正文.mdx');
  sourceMap.sourcesContent.push('export const virtual = true;');
  return {
    originalSource,
    source: source.text,
    sourceMap: JSON.stringify(sourceMap),
    sourcePath: source.path,
    sourceMapPath: map.path,
  };
}

async function run(runner, built) {
  const start = scripts.length;
  await runner.run(built);
  for (const script of scripts.slice(start)) {
    const { scriptSource } = await post('Debugger.getScriptSource', { scriptId: script.scriptId });
    if (scriptSource.startsWith(built.source)) {
      return {
        script,
        scriptSource,
        output: runner.getOutput(),
      };
    }
  }
  throw new Error('Debugger.scriptParsed did not expose the VM bundle');
}

function readMap(result) {
  assert.match(result.script.sourceMapURL, /^file:\/\//);
  return JSON.parse(fs.readFileSync(fileURLToPath(result.script.sourceMapURL), 'utf8'));
}

async function main() {
  fs.mkdirSync(root, { recursive: true });
  session.connect();
  session.on('Debugger.scriptParsed', ({ params }) => scripts.push(params));
  await post('Debugger.enable');
  assert.equal(inspector.url(), undefined);

  const runner = new Runner(builder);
  const built = bundle(7);
  const normal = await run(runner, built);
  const normalCacheExists = fs.existsSync(cacheDir);

  inspector.open(0, '127.0.0.1', false);
  openedInspector = true;
  assert.ok(inspector.url());
  const debug = await run(runner, built);
  const repeated = await run(runner, built);
  const map = readMap(debug);
  const mapIndex = map.sources.indexOf(pathToFileURL(sourcePath).href);
  assert.notEqual(mapIndex, -1, `map source must identify the original file: ${JSON.stringify({ expected: pathToFileURL(sourcePath).href, sources: map.sources, raw: JSON.parse(built.sourceMap).sources })}`);
  const valueOffset = built.source.indexOf('value = 7');
  assert.notEqual(valueOffset, -1);
  const prefix = built.source.slice(0, valueOffset);
  const originalPosition = await SourceMapConsumer.with(map, null, (consumer) => {
    const position = consumer.originalPositionFor({
      line: prefix.split('\n').length,
      column: valueOffset - (prefix.lastIndexOf('\n') + 1),
    });
    return { source: position.source, line: position.line, column: position.column };
  });

  const rebuilt = await run(runner, bundle(11));
  const rebuiltMap = readMap(rebuilt);
  const other = await run(new Runner(builder), built);
  const errors = [];
  fs.writeFileSync(path.join(root, 'blocked-cache'), 'This is a file, not a cache directory.');
  const fallback = await run(new Runner({
    ...builder,
    options: { ...builder.options, cache: 'blocked-cache' },
    logger: { error: (message) => errors.push(message) },
  }), built);
  const relativeMapPath = path.relative(cacheDir, fileURLToPath(debug.script.sourceMapURL));
  return {
    expectedSourceURL: pathToFileURL(sourcePath).href,
    expectedRuntimeDir: runtimeDir,
    expectedRuntimeFile: runtimeFile,
    expectedChalkPath: createRequire(runtimeFile).resolve('chalk'),
    originalSource: built.originalSource,
    normal: {
      cacheExists: normalCacheExists,
      sourceUnchanged: normal.scriptSource === built.source,
      sourceMapURL: normal.script.sourceMapURL,
      output: normal.output,
    },
    debug: {
      sourceURL: debug.script.url,
      sourceMapURL: debug.script.sourceMapURL,
      mapInsideCache: !relativeMapPath.startsWith('..') && !path.isAbsolute(relativeMapPath),
      mapSource: map.sources[mapIndex],
      sourceContent: map.sourcesContent[mapIndex],
      virtualSource: map.sources.find((source) => source.startsWith('mdx-loader:')),
      originalPosition,
      output: debug.output,
    },
    repeated: {
      sourceURL: repeated.script.url,
      sourceMapURL: repeated.script.sourceMapURL,
    },
    rebuilt: {
      sourceURL: rebuilt.script.url,
      sourceMapURL: rebuilt.script.sourceMapURL,
      value: rebuilt.output.value,
      originalSource: rebuiltMap.sourcesContent[
        rebuiltMap.sources.indexOf(pathToFileURL(sourcePath).href)
      ],
    },
    other: { sourceURL: other.script.url },
    fallback: {
      sourceUnchanged: fallback.scriptSource === built.source,
      sourceMapURL: fallback.script.sourceMapURL,
      output: fallback.output,
      errors,
    },
  };
}

main().then((result) => {
  process.stdout.write(JSON.stringify(result));
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => {
  session.disconnect();
  if (openedInspector) inspector.close();
  assert.equal(path.dirname(tempRoot), path.resolve(os.tmpdir()));
  assert.ok(path.basename(tempRoot).startsWith('blog-runner-map-'));
  fs.rmSync(tempRoot, { recursive: true, force: true });
});
