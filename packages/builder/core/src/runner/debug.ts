import { createHash } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { url as inspectorUrl } from 'inspector';
import { dirname, join, parse } from 'path';
import { pathToFileURL } from 'url';
import type { BundlerResult } from '@blog/types';
import type { RawSourceMap } from 'source-map';

const isWindowsPath = (value: string) => /^[a-z]:[\\/]/i.test(value);

function resolveMapUrl(reference: string, base: URL): URL {
  const normalized = reference.replace(/\\/g, '/');
  return new URL(isWindowsPath(normalized) ? `file:///${normalized}` : normalized, base);
}

function getSourceUrl(source: string, sourceRoot: string, mapPath: string): string {
  // 保留 MDX 等加载器的虚拟源码标识，不将生成的 JSX 误标为原稿。
  if (!isWindowsPath(source) && /^[a-z][\w+.-]*:/i.test(source)) {
    return source;
  }

  const mapUrl = pathToFileURL(mapPath);
  const root = sourceRoot.endsWith('/') ? sourceRoot : `${sourceRoot}/`;
  const base = sourceRoot ? resolveMapUrl(root, mapUrl) : new URL('.', mapUrl);

  // esbuild 已对 sources 中的 #、% 和中文做了 URL 编码，不能再次按文件路径编码。
  return resolveMapUrl(source, base).href;
}

/** 仅在 Node 调试器开启时，为内存中的 VM 脚本提供外部 source map。 */
export async function prepareDebugScript(
  result: BundlerResult,
  cacheDirectory: string,
  runnerId: number,
): Promise<string> {
  const { source, sourceMap, sourcePath, sourceMapPath } = result;

  if (!inspectorUrl() || !sourceMap || !sourcePath || !sourceMapPath) {
    return source;
  }

  const { dir, name, ext } = parse(sourcePath);
  const sourceUrl = pathToFileURL(join(dir, `${name}.runner-${runnerId}${ext}`)).href;
  const map: RawSourceMap = JSON.parse(sourceMap);

  // map 搬到缓存目录后，不能再按旧的相对路径寻找源码。
  map.sources = map.sources.map((item) => getSourceUrl(item, map.sourceRoot ?? '', sourceMapPath));
  delete map.sourceRoot;
  map.file = sourceUrl;

  const content = JSON.stringify(map);
  const hash = createHash('sha256').update(content).digest('hex');
  const mapPath = join(cacheDirectory, 'debug', `${hash}.js.map`);

  await mkdir(dirname(mapPath), { recursive: true });
  await writeFile(mapPath, content, 'utf8');

  // 稳定的脚本标识用于重绑断点；map URL 随内容变化，避免 watch 复用旧映射。
  return `${source}\n//# sourceURL=${sourceUrl}\n//# sourceMappingURL=${pathToFileURL(mapPath).href}\n`;
}
