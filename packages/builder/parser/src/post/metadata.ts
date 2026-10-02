import { stat } from 'fs/promises';
import { join } from 'path';
import { toPinyin, normalize } from '@blog/node';
import type { PostMeta, PostData } from '@blog/types';
import { parse as parseYaml } from 'yaml';

/** 获取元数据 */
export function getPostMetaData(content: string, fileName: string) {
  const result = content.match(/^---([\d\D]+?)---([\d\D]*)$/);

  if (!result) {
    throw {
      message: `文件格式错误: ${fileName}`,
    };
  }

  const [
    , metaStr, mdContent,
  ] = result;
  const meta = parseYaml(metaStr) as PostMeta;

  meta.content = mdContent.trim();

  if (!meta) {
    throw {
      message: `文章属性解析失败: ${fileName}`,
    };
  }

  // 检查必填属性
  const required = (['title', 'create'] as const).filter((key) => !meta[key]);

  if (required.length > 0) {
    throw {
      message: `文章必须要有 ${required.join(', ')} 字段：${fileName}`,
    };
  }

  if (meta.lsp !== undefined && typeof meta.lsp !== 'boolean') {
    throw new Error(`文章 lsp 配置必须是布尔值：${fileName}`);
  }

  return meta;
}

function getDateByDay(input: string) {
  const date = new Date(input);
  date.setUTCHours(8, 0, 0, 0);
  return date.getTime();
}

/** 整理文章配置和正文，此处不解析或改写正文。 */
export async function getPostData(content: string, fileName: string) {
  const meta = getPostMetaData(content, fileName);
  const postContent = (meta.content ?? '').trim();
  const createAt = new Date(meta.create).getFullYear().toString();
  const decodeTitle = toPinyin(meta.title).toLowerCase();
  const data: Omit<PostData, 'ast'> = {
    title: meta.title,
    create: getDateByDay(meta.create),
    update: meta.update ? getDateByDay(meta.update) : (await stat(fileName)).mtimeMs,
    tags: (meta.tags ? (Array.isArray(meta.tags) ? meta.tags : [meta.tags]) : []).map((name) => ({
      name,
      url: '',
    })),
    public: meta.public ?? true,
    content: postContent,
    filePath: normalize(fileName),
    pathname: meta.pathname
      ? normalize(meta.pathname)
      : normalize(join('posts', createAt, decodeTitle)),
    toc: meta.toc ?? true,
    lsp: meta.lsp ?? false,
    template: meta.template ?? 'post',
    draft: meta.draft ?? false,
    description:
      meta.description
      ?? meta.content
        .trim()
        .slice(0, 200)
        .replace(/[\n\r]/g, ''),
  };
  return data;
}
