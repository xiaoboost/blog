import FontMin from 'fontmin';
import { dirname, isAbsolute, join, basename } from 'path';
import { normalize, isRootDirectory } from '@blog/node';
import { readFile } from 'fs/promises';
import { getAccessor } from '@blog/context/runtime';
import { getChildrenContent, getAttribute } from '@blog/parser/walk';
import type { PostExportData } from '@blog/types';
import type { CustomFontData } from './types';
import type { FontBlockProps } from './index';
import { CustomFont } from './font';

/** 字体源文件缓存 */
const fileCache = getAccessor('font-block:source', new Map<string, Buffer>()).get();
/** 字体数据缓存 */
const fontCache = getAccessor('font-block:font', new Map<string, CustomFont>()).get();

/** 获取自定义字体标识符 */
function getCustomFontKey(data: CustomFontData) {
  return `${data.post}:${data.src}:${data.text.join(',')}`;
}

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
    } else if (isAbsolute(input)) {
      return input;
    } else {
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

/** 获取自定义字体 */
export function getCustomFontByData(data: CustomFontData) {
  const src = resolveFontPath(data.src, data.post);
  const key = getCustomFontKey({ ...data, src });

  if (fontCache.has(key)) {
    return fontCache.get(key)!;
  }

  const font = new CustomFont(data.src, data.post, data.text);
  fontCache.set(key, font);
  return font;
}

/** 从渲染属性获得自定义字体 */
export function getCustomFontByProps(props: FontBlockProps) {
  const src = normalize(props.src).replace(/(\.+\/)+/, '');
  const text = props.children.trim();

  for (const font of fontCache.values()) {
    if (font.src.includes(src) && font.text.includes(text)) {
      return font;
    }
  }
}

/** 获取文章内所有自定义文本 */
export function getCustomTextByPost({ data: post }: PostExportData) {
  const result: CustomFontData[] = [];

  for (const node of post.ast.children) {
    if (node.type !== 'mdxJsxFlowElement' || node.name !== 'FontBlock') {
      continue;
    }

    const text = getChildrenContent(node);
    const srcAttr = getAttribute('src', node.attributes)?.value;
    const src = (srcAttr ?? (srcAttr as any)?.value) as string;

    if (!src) {
      throw new Error(`FontBlock 组件必须含有\`src\`属性`);
    }

    const fontPath = resolveFontPath(src, post.filePath);
    const oldFontData = result.find((item) => item.src === fontPath);

    if (oldFontData) {
      oldFontData.text.push(text);
    } else {
      result.push({
        src: fontPath,
        post: post.pathname,
        text: [text],
      });
    }
  }

  return result;
}

/** 根据文本获取压缩字体数据 */
export function getMinFontFile(font: Buffer, text: Set<string>) {
  interface FontFileData {
    basename: string;
    contents: Uint8Array;
  }

  return new Promise<Buffer>((resolve, reject) => {
    new FontMin()
      .src(font)
      .use(
        FontMin.glyph({
          text: Array.from(text).join(''),
          hinting: false,
        }),
      )
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
