import * as path from 'path';

import Glob from 'fast-glob';

import { parse } from 'yaml';
import { promises as fs } from 'fs';
import { toPinyin } from '@blog/utils';
import { resolve, inputDir } from './utils';
import { PostMeta, PostData } from './types';

function render(data: PostData) {
  // return data;
}

function writeFile(data: PostData) {
  // return data;
}

function writeIndexFile() {
  // ..
}

async function getPostData(fileName: string): Promise<PostData> {
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

  const createAt = (new Date(meta.create)).getFullYear().toString();
  const decodeTitle = toPinyin(meta.title).toLowerCase();
  const data: PostData = {
    title: meta.title,
    create: new Date(meta.create).getTime(),
    update: meta.update
      ? new Date(meta.update).getTime()
      : (await fs.stat(fileName)).mtimeMs,
    tags: meta.tags ?? [],
    content: (mdContent ?? '').trim(),
    public: meta.public ?? true,
    pathname: meta.pathname ?? path.join('posts', createAt, decodeTitle),
    toc: meta.toc ?? true,
    description: meta.description
      ?? mdContent.trim().slice(0, 200).replace(/[\n\r]/g, ''),
    html: '',
    styles: [],
    scripts: [],
  };

  render(data);
  writeFile(data);

  return data;
}

async function build() {
  const postsFile = await Glob(path.join(inputDir, '**/*.md').replace(/\\/g, '/'));
  const postsData = await Promise.all(postsFile.map(getPostData));
  const posts = postsData.sort((pre, next) => pre.create > next.create ? -1 : 1);

  console.log(postsData);
}

build();
