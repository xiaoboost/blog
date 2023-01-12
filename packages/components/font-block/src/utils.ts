import FontMin from 'fontmin';
import { dirname, isAbsolute, parse } from 'path';
import { normalize } from '@blog/node';
import { readFile } from 'fs/promises';
import { getAccessor, builderOptions } from '@blog/context/runtime';
import { getChildrenContent, getAttribute } from '@blog/parser';
import type { PostExportData } from '@blog/types';

const fileCache = getAccessor('fileCache', new Map<string, Buffer>()).get();
const fontCache = getAccessor('fontCache', new Map<string, MinFontData>()).get();

export interface CustomFontData {
  /** 字体文件原始路径 */
  src: string;
  /** 原文文本 */
  text: string[];
  /** 裁剪的字体字符集 */
  charSet: Set<string>;
}

export interface MinFontData extends CustomFontData {
  /** 网页元素类名 */
  className: string;
  /** 自定义字体名称 */
  fontFamily: string;
  /** 裁剪后的字体文件数据 */
  content: Buffer;
}

function mergeTextSet(text: string, set = new Set<string>()) {
  Array.from(new Set(text))
    .filter((item) => item.length > 0)
    .forEach((key) => set.add(key));

  return set;
}

export function getCustomTextByPost({ data: post }: PostExportData) {
  const result: CustomFontData[] = [];
  const postDir = dirname(post.filePath);

  for (const node of post.ast.children) {
    if (node.type !== 'mdxJsxFlowElement' || node.name !== 'FontBlock') {
      continue;
    }

    const text = getChildrenContent(node);
    const src = getAttribute('src', node.attributes)?.value;

    if (!src) {
      throw new Error(`FontBlock 组件必须含有\`src\`属性`);
    }

    const fontPath = isAbsolute(src) ? normalize(src) : normalize(postDir, src);
    const oldFontData = result.find((item) => item.src === fontPath);
    const charSet = mergeTextSet(text, oldFontData?.charSet);

    if (oldFontData) {
      oldFontData.text.push(text);
      oldFontData.charSet = charSet;
    } else {
      result.push({
        src: fontPath,
        text: [text],
        charSet,
      });
    }
  }

  return result;
}

export async function getCustomFontContent(src: string, text: string): Promise<MinFontData> {
  if (builderOptions.mode === 'production') {
    const content = fileCache.has(src) ? fileCache.get(src)! : await readFile(src);

    if (!fileCache.has(src)) {
      fileCache.set(src, content);
    }

    return {
      src,
      text: ['*'],
      fontFamily: '',
      content,
    };
  }

  const key = `${src}:${text}`;
  const data: MinFontData = {
    src,
    text,
  };

  if (fontCache.has(key)) {
  }
}

export function getFontFile(original: string, text: string) {
  interface FontFileData {
    basename: string;
    contents: Uint8Array;
  }

  return new Promise<Buffer>((resolve, reject) => {
    new FontMin()
      .src(original)
      .use(FontMin.glyph({ text, hinting: false }))
      .use(FontMin.ttf2woff2())
      .run((err, files: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const woff2 = files.find((item: FontFileData) => item.basename.endsWith('.woff2'));

        if (woff2?.contents) {
          resolve(Buffer.from(woff2.contents));
        } else {
          reject(new Error(`生成字体失败，当前文本：${text}`));
        }
      });
  });
}
