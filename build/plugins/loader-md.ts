import { Plugin } from 'esbuild';

import path from 'path';

import { parse } from 'yaml';
import { promises as fs } from 'fs';
import { resolveFile } from './utils';

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
  /** 文章链接 */
  pathname?: string;
  /** 是否可以被列表检索 */
  public?: boolean;
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
  /** 文章标题 */
  title: string;
  /** 文章创建时间 */
  create: number;
  /** 文章最后更新时间 */
  update: number;
  /** 文章标签 */
  tags: string[];
  /** 是否可以被列表检索 */
  public: boolean;
  /** 文章原文 */
  content: string;
  /** 文章简介 */
  description: string;
  /** 渲染后的网页源码 */
  html: string;
  /** 网页链接 */
  pathname: string;
  /** 文章启用的插件 */
  plugins: string[];
  /** 样式文件列表 */
  styles: string[];
  /** 脚本文件列表 */
  scripts: string[];
}

/** 默认插件 */
const defaultPlugins: string[] = ['goto-top'];

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
    content: (mdContent ?? '').trim(),
    public: meta.public ?? true,
    pathname: meta.pathname ?? '',
    plugins: [],
    description: meta.description
      ?? mdContent.trim().slice(0, 200).replace(/[\n\r]/g, ''),
    html: '',
    styles: [],
    scripts: [],
  };

  // 默认全部加载
  if (
    (!meta.plugins || meta.plugins.length === 0) &&
    (!meta.disabled || meta.disabled.length === 0)
  ) {
    post.plugins = defaultPlugins;
  }
  // 输入插件列表，则以此为准
  else if (meta.plugins && meta.plugins.length > 0) {
    post.plugins = meta.plugins;
  }
  // 禁用插件列表，则取反
  else if (meta.disabled && meta.disabled.length > 0) {
    post.plugins = defaultPlugins.filter((item) => !meta.disabled!.includes(item));
  }

  return post;
}

export function mdLoader(): Plugin {
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
          contents: `export default ${JSON.stringify(post)};`,
          resolveDir: path.dirname(args.path),
          loader: 'ts',
        };
      });
    },
  };
}
