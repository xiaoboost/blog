import { readFile, stat } from 'fs/promises';
import {
  dirname,
  isAbsolute,
  resolve,
  basename,
  parse,
} from 'path';
import { normalize, isRootDirectory, toPinyin } from '@blog/node';
import type { RuntimeContext } from '@blog/types';
import React from 'react';

export interface FontFileCache {
  version: string;
  content: Buffer;
}

/** 获取字体路径 */
export function resolveFontPath(src: string, options: {
  postPath?: string;
  baseDir?: string;
  resolve: RuntimeContext['resolve'];
}) {
  const { postPath, baseDir, resolve: resolveModule } = options;

  if (baseDir !== undefined && !isAbsolute(baseDir)) {
    throw new Error('FontBlock 的 baseDir 必须是绝对目录，请使用 baseDir={__dirname}');
  }

  const directory = baseDir ?? (postPath ? dirname(postPath) : undefined);
  let fontPath: string;

  if (isAbsolute(src)) {
    fontPath = src;
  }
  else if (src.startsWith('@blog/')) {
    fontPath = resolveModule(src, { importer: postPath, resolveDir: directory }).path;
  }
  else if (baseDir !== undefined || src.startsWith('.')) {
    if (!directory) {
      throw new Error('FontBlock 的相对字体路径需要 baseDir={__dirname}');
    }

    fontPath = resolve(directory, src);
  }
  else {
    let current = directory;

    while (current && basename(current) !== 'posts' && !isRootDirectory(current)) {
      current = dirname(current);
    }

    if (!current || isRootDirectory(current)) {
      throw new Error('FontBlock 未找到 posts 目录，请显式提供 baseDir={__dirname}');
    }

    fontPath = resolve(current, src);
  }

  return normalize(fontPath);
}

/** 获取字体块内文本 */
export function getFontText(children: React.ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children);
  }

  if (React.isValidElement<{ children?: React.ReactNode }>(children)) {
    return getFontText(children.props.children);
  }

  if (Array.isArray(children)) {
    return children.map(getFontText).join('');
  }

  return '';
}

/** 根据文件名分配未被占用的字体名 */
export function getFontFamily(fontPath: string, used: ReadonlySet<string>) {
  const name = toPinyin(parse(fontPath).name);
  let family = name;
  let suffix = 2;

  while (used.has(family)) {
    family = `${name}-${suffix++}`;
  }

  return family;
}

/** 同轮合并读取请求，跨轮按文件版本复用内容 */
export function getFontContentBySrc(
  src: string,
  fileCache: Map<string, FontFileCache>,
  pendingFiles: Map<string, Promise<Buffer>>,
): Promise<Buffer> {
  let content = pendingFiles.get(src);

  if (!content) {
    content = stat(src).then(async ({ mtimeMs, ctimeMs, size }) => {
      const version = `${mtimeMs}:${ctimeMs}:${size}`;
      const cached = fileCache.get(src);

      if (cached?.version === version) {
        return cached.content;
      }

      const buffer = await readFile(src);
      fileCache.set(src, { version, content: buffer });
      return buffer;
    }).catch((error) => {
      fileCache.delete(src);
      throw error;
    });
    pendingFiles.set(src, content);
  }

  return content;
}
