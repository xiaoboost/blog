import { readFile, stat } from 'fs/promises';
import {
  dirname,
  isAbsolute,
  resolve,
  basename,
  parse,
} from 'path';
import { Builder, getAccessor } from '@blog/context/runtime';
import { normalize, isRootDirectory, toPinyin } from '@blog/node';
import type { IPage, PageDataMap } from '@blog/types';
import React from 'react';

interface FontBlockData {
  src: string;
  family: string;
  text: string[];
}

interface FontFileCache {
  version: string;
  content: Buffer;
}

/** 字体源文件跨构建缓存 */
const fileCache = getAccessor('font-block:source', new Map<string, FontFileCache>()).get();
/** 字体请求 */
const pendingFiles = new Map<string, Promise<Buffer>>();
/** 页面字体数据 */
const pageFonts = new WeakMap<IPage, Map<string, FontBlockData>>();

/** 获取字体路径 */
export function resolveFontPath(src: string, postPath?: string, baseDir?: string) {
  if (baseDir !== undefined && !isAbsolute(baseDir)) {
    throw new Error('FontBlock 的 baseDir 必须是绝对目录，请使用 baseDir={__dirname}');
  }

  const directory = baseDir ?? (postPath ? dirname(postPath) : undefined);
  let fontPath: string;

  if (isAbsolute(src)) {
    fontPath = src;
  }
  else if (src.startsWith('@blog/')) {
    fontPath = Builder.resolve(src, { importer: postPath, resolveDir: directory }).path;
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

  // 先登记再读取，字体被删除或暂时缺失时，重新创建文件也能触发重建。
  fontPath = normalize(fontPath);
  Builder.addWatchFiles(fontPath);
  return fontPath;
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

/** 编译当前页面内自定义字体 */
export function getFontData(page: IPage, src: string, baseDir?: string) {
  const postPath = page.type === 'post'
    ? (page.data as PageDataMap['post']).post.data.filePath
    : undefined;
  const fontPath = resolveFontPath(src, postPath, baseDir);
  let fonts = pageFonts.get(page);

  if (!fonts) {
    fonts = new Map();
    pageFonts.set(page, fonts);
  }

  let data = fonts.get(fontPath);

  if (!data) {
    const name = toPinyin(parse(fontPath).name);
    const used = new Set([...fonts.values()].map((font) => font.family));
    let family = name;
    let suffix = 2;

    while (used.has(family) || page.getFontBuckets().has(family)) {
      family = `${name}-${suffix++}`;
    }

    data = { src: fontPath, family, text: [] };
    fonts.set(fontPath, data);
  }

  return data;
}

export function getPageFonts(page: IPage) {
  return [...pageFonts.get(page)?.values() ?? []];
}

export function getFontContentBySrc(src: string): Promise<Buffer> {
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
