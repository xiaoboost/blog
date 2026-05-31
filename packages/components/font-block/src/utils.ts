import { readFile } from 'fs/promises';
import { dirname, isAbsolute, join, basename } from 'path';
import { getAccessor, RuntimeBuilder as Builder } from '@blog/context/runtime';
import { normalize, isRootDirectory } from '@blog/node';
import { getChildrenContent, getAttribute, visit } from '@blog/parser/walk';
import type { PostExportData } from '@blog/types';

export interface FontBlockData {
  /** 字体文件原始路径 */
  originSrc: string;
  /** 字体文件解析后的路径 */
  src: string;
  /** 原文文本 */
  text: string[];
}

/** 字体源文件缓存 */
const fileCache = getAccessor('font-block:source', new Map<string, Buffer>()).get();
/** 字体 className 缓存 */
const classCache = getAccessor('font-block:class', new Map<string, string>()).get();

/** 获取字体完整路径 */
function resolveFontPath(src: string, postPath: string) {
  function getBasePath(input: string) {
    let current = input;

    while (basename(current) !== 'posts' && !isRootDirectory(current)) {
      current = dirname(current);
    }

    if (isRootDirectory(current)) {
      throw new Error('获取字体路径时计算错误');
    }

    return current;
  }

  function getFontFilePath(input: string, file: string) {
    if (input.startsWith('.')) {
      return join(dirname(file), input);
    }
    else if (input.startsWith('@blog/')) {
      return Builder.resolve(input, {
        importer: file,
      }).path;
    }
    else if (isAbsolute(input)) {
      return input;
    }
    else {
      return join(getBasePath(file), input);
    }
  }

  return normalize(require.resolve(getFontFilePath(src, postPath)));
}

/** 获取字体文件原始文件数据 */
export async function getFontContentBySrc(src: string) {
  const content = fileCache.has(src) ? fileCache.get(src)! : await readFile(src);

  if (!fileCache.has(src)) {
    fileCache.set(src, content);
  }

  return content;
}

/** 缓存字体 className */
export function setFontClass(src: string, className: string): void {
  classCache.set(src, className);
}

/** 渲染时查找字体 className */
export function getFontClass(src: string): string | undefined {
  return classCache.get(src);
}

/** 获取文章内所有自定义文本 */
export function getCustomTextByPost({ data: post }: PostExportData) {
  const result: FontBlockData[] = [];

  visit(post.ast, (node) => {
    if (node.type !== 'mdxJsxFlowElement' || node.name !== 'FontBlock') {
      return;
    }

    const text = getChildrenContent(node);
    const srcAttr = getAttribute('src', node.attributes)?.value;
    const src = (srcAttr ?? (srcAttr as any)?.value) as string;

    if (!src) {
      throw new Error('FontBlock 组件必须含有`src`属性');
    }

    const fontPath = resolveFontPath(src, post.filePath);
    const oldFontData = result.find((item) => item.src === fontPath);

    if (oldFontData) {
      oldFontData.text.push(text);
    }
    else {
      result.push({
        originSrc: src,
        src: fontPath,
        text: [text],
      });
    }
  });

  return result;
}
