import { readFile } from 'fs/promises';
import { dirname, isAbsolute, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import remapping from '@ampproject/remapping';
import type {
  CodeFrameData,
  Range,
  SourceMapV3,
  TransformState,
} from '@blog/types';
import { lookItUp } from 'look-it-up';
import { SourceMapConsumer } from 'source-map';

function getSource(sourceMap: SourceMapConsumer, raw: string, fullPath: string) {
  try {
    const result = sourceMap.sourceContentFor(raw);

    if (result) {
      return result;
    }
  }
  catch {
    // ..
  }

  return readFile(fullPath, 'utf-8');
}

export async function getOriginCodeFrame(
  position: Range,
  rawSourceMap: string,
): Promise<(CodeFrameData & { path: string }) | undefined> {
  const sourceMap = await new SourceMapConsumer(rawSourceMap);
  const startLoc = sourceMap.originalPositionFor({
    line: position.start.line,
    column: position.start.column,
    bias: SourceMapConsumer.GREATEST_LOWER_BOUND,
  });
  const endLoc = sourceMap.originalPositionFor({
    line: position.end.line,
    column: position.end.column,
    bias: SourceMapConsumer.LEAST_UPPER_BOUND,
  });

  if (!startLoc.line || !endLoc.line) {
    return;
  }

  const rawFilePath = startLoc.source ?? endLoc.source;

  if (!rawFilePath) {
    return;
  }

  const filePath = isAbsolute(rawFilePath) ? rawFilePath : await lookItUp(rawFilePath, __dirname);
  const fileContent = filePath && (await getSource(sourceMap, rawFilePath, filePath));

  if (!filePath || !fileContent) {
    return;
  }

  return {
    path: filePath,
    content: fileContent,
    range: {
      start: {
        line: startLoc.line,
        column: (startLoc.column ?? 0) + 1,
      },
      end: {
        line: endLoc.line,
        column: endLoc.column ?? 1,
      },
    },
  };
}

export function validateMap(map: TransformState['map']): void {
  if (map === null || map === 'identity') {
    return;
  }

  if (
    !map || map.version !== 3 || typeof map.mappings !== 'string'
    || !Array.isArray(map.sources) || !map.sources.every((source) => typeof source === 'string')
    || !Array.isArray(map.names) || !map.names.every((name) => typeof name === 'string')
    || (map.sourcesContent !== undefined && (!Array.isArray(map.sourcesContent)
      || !map.sourcesContent.every((content) => content === null || typeof content === 'string')))
    || 'sections' in map
  ) {
    throw new Error('map 必须是 source map v3、identity 或 null');
  }
}

/** 后一步输出 → 前一步输入 → 原始源码。丢失的映射不能在后续步骤中恢复。 */
export function composeMaps(
  previous: TransformState['map'],
  next: TransformState['map'],
): TransformState['map'] {
  validateMap(next);

  if (next === 'identity') {
    return previous;
  }

  if (next === null || previous === null) {
    return null;
  }

  if (previous === 'identity') {
    return next;
  }

  // update 的本步映射只有一个输入；直接返回完整状态可提供多来源的累计映射。
  if (next.sources.length !== 1) {
    throw new Error('连接映射时，本步 map 必须只指向当前模块这一个输入');
  }

  return JSON.parse(remapping([
    JSON.stringify(next),
    JSON.stringify(previous),
  ], () => null).toString()) as SourceMapV3;
}

// 只识别独占一行的末尾指令，不改动正文中字符串里的相似文字。
const sourceMapComment = new RegExp([
  '(?:^|\\n)[\\t ]*(?:',
  '\\/\\/[#@][\\t ]*sourceMappingURL=([^\\r\\n]*)',
  '|\\/\\*[#@][\\t ]*sourceMappingURL=([^\\r\\n]*?)[\\t ]*\\*\\/)',
  '[\\t ]*(?:\\r?\\n)?$',
].join(''));

export async function readSourceMap(
  code: string,
  sourcePath: string | undefined,
  resolveDir: string | undefined,
  files: Set<string>,
): Promise<TransformState['map']> {
  const match = code.match(sourceMapComment);

  if (!match) {
    return 'identity';
  }

  try {
    const url = (match[1] ?? match[2]).trim();
    let json: string;
    let mapPath: string | undefined;

    if (url.startsWith('data:application/json')) {
      const comma = url.indexOf(',');
      const payload = url.slice(comma + 1);
      json = url.slice(0, comma).endsWith(';base64')
        ? Buffer.from(payload, 'base64').toString('utf8')
        : decodeURIComponent(payload);
    }
    else {
      const base = sourcePath ? dirname(sourcePath) : resolveDir;

      // 不在构建中下载远程映射，也不凭 cwd 猜虚拟模块的来源。
      if (!base || (/^[a-z]+:/i.test(url) && !isAbsolute(url) && !url.startsWith('file:'))) {
        return null;
      }

      mapPath = url.startsWith('file:') ? fileURLToPath(url) : resolve(base, url);
      files.add(mapPath);
      json = await readFile(mapPath, 'utf8');
    }

    const map = JSON.parse(json) as SourceMapV3;
    validateMap(map);

    if (!mapPath) {
      return map;
    }

    const baseURL = pathToFileURL(mapPath);
    const root = map.sourceRoot;
    const sourceRoot = root
      ? isAbsolute(root)
        ? pathToFileURL(`${root.replace(/[\\/]$/, '')}/`)
        : new URL(`${root.replace(/\/$/, '')}/`, baseURL)
      : baseURL;
    return {
      ...map,
      sourceRoot: undefined,
      sources: map.sources.map((source) => isAbsolute(source)
        ? pathToFileURL(source).href
        : new URL(source, sourceRoot).href),
    };
  }
  catch {
    // 旧代码原样返回时仍由 esbuild 报告无效映射；一旦改写，不沿用失效的映射。
    return null;
  }
}

export function appendInlineMap(state: TransformState, initial: TransformState): string {
  // 未引入映射时，保留旧代码和 esbuild 自身的映射行为，避免改变既有产物。
  if (state.map === initial.map && state.code === initial.code) {
    return state.code;
  }

  const code = state.code.replace(sourceMapComment, (comment) => comment.replace(/[^\r\n]/g, ' '));

  if (state.map === null || state.map === 'identity' || state.format === 'json') {
    return code;
  }

  const url = `data:application/json;base64,${Buffer.from(JSON.stringify(state.map)).toString('base64')}`;
  return state.format === 'css'
    ? `${code}\n/*# sourceMappingURL=${url} */`
    : `${code}\n//# sourceMappingURL=${url}`;
}
