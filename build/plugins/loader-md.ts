import { Plugin } from 'esbuild';

import path from 'path';

import { parse } from 'yaml';
import { promises as fs } from 'fs';
import { resolveFile } from './utils';
import { Template } from '../process/template';

/** 文章原始元数据 */
interface PostMeta {
  /** 文章标题 */
  title: string;
  /** 文章创建时间 */
  create: string;
  /** 文章原文 */
  content: string;
  /** 文章简介 */
  description?: string;
  /** 是否可以被列表检索 */
  public?: boolean;
  /** 指定网页标题 */
  htmlTitle?: string;
  /** 文章标签 */
  tags?: string[];
  /** 文章最后更新时间 */
  update?: string;
  /** 文章模板 */
  template?: string;
  /** 文章启用的插件 */
  plugins?: string[];
  /** 禁用的插件 */
  disabled?: string[];
}

/** 文章元数据 */
export interface PostData {
  title: string;
  create: number;
  update: number;
  tags: string[];
  html: string;
  htmlTitle: string;
  public: boolean;
  content: string;
  description: string;
}

/**
 * 从 esbuild 来的文件源码
 * 
 * 这里解析成 .ts 文件输出
 * 但是还需要对应到 render 之后的网页原文
 * 这个 .ts 文件重包含全部的静态引用文件
 * 
 * md 解析后的内容形成字符串
 * 
 * 那么 esbuild 打包之后形成的文件，再运行一次，这样文件就全都塞到 files 里面去了
 */

export interface Options {
  template: Template;
}

async function readMeta(fileName: string) {
  const content = await fs.readFile(fileName, 'utf-8');
  const result = content.match(/^---([\d\D]+?)---([\d\D]*)$/);

  if (!result) {
    throw {
      message: `文件格式错误: ${fileName}`,
    };
  }

  const [, metaStr, mdContent] = result;
  const meta = parse(metaStr) as PostMeta;

  if (!meta) {
    throw {
      message: `缺失文章属性: ${fileName}`,
    };
  }

  // 检查必填属性
  const required = ['create', 'title'].filter((key) => !meta[key]);

  if (required.length > 0) {
    throw {
      message: `文章必须要有 [${required.join(', ')}] 字段`,
    };
  }

  const post: PostData = {
    title: meta.title,
    create: new Date(meta.create).getTime(),
    update: meta.update
      ? new Date(meta.update).getTime()
      : (await fs.stat(fileName)).mtimeMs,
    tags: meta.tags ?? [],
    html: '',
    content: (mdContent ?? '').trim(),
    htmlTitle: meta.htmlTitle ?? '',
    public: meta.public ?? true,
    description: meta.description
      ?? mdContent.trim().slice(0, 200).replace(/[\n\r]/g, ''),
  };

  return post;
}

export function mdLoader(opt: Options): Plugin {
  return {
    name: 'md-loader',
    setup(build) {
      const namespace = 'markdown';

      build.onResolve({ filter: /\.mdx?$/ }, args => ({
        namespace,
        path: resolveFile(args.resolveDir, args.path),
      }));

      build.onLoad({ filter: /.*/, namespace, }, async (args) => {
        const post = await readMeta(args.path);

        return {
          contents: '',
          resolveDir: path.dirname(args.path),
          loader: 'ts',
        };
      });
    },
  };
}
