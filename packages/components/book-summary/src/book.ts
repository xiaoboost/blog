import { getReference, RuntimeBuilder } from '@blog/context/runtime';
import { load as loadHtml } from 'cheerio';
import { imageSize as imageCheck } from 'image-size';
import { BookData, BookCache } from './types';
import { ComponentName } from './constant';

/** 书籍数据 */
export const bookMap = getReference(`${ComponentName}-map`, new Map<number, BookData>());
/** 书籍编号生成起点地址 */
export const getUrlFromId = (id: number) => `https://www.qidian.com/book/${id}/`;

/** 生成缓存文件路径 */
const getCacheFilePath = (id: number) => ({
  meta: `${id}-meta.json`,
  // 缓存统一用 jpg 后缀，构建的时候需要检查真实的文件类型
  cover: `${id}-cover.jpg`,
});

async function getBookDataFromDisk(id: number): Promise<BookData | undefined> {
  const builderCache = RuntimeBuilder.getCacheAccessor(ComponentName);
  const [metaDataBuffer, coverDataBuffer] = await Promise.all([
    builderCache.read(getCacheFilePath(id).meta),
    builderCache.read(getCacheFilePath(id).cover),
  ]);

  if (!metaDataBuffer || !coverDataBuffer) {
    return;
  }

  RuntimeBuilder.logger.debug(`书籍 ${id} 数据从缓存中获取。`);

  const data = JSON.parse(metaDataBuffer.toString('utf-8')) as BookCache;

  // TODO: 缓存取出来的也要重新 hash

  return {
    ...data,
    cover: coverDataBuffer,
  };
}

async function getBookDataFromUrl(id: number): Promise<BookData | undefined> {
  RuntimeBuilder.logger.debug(`书籍 ${id} 未找到缓存，开始从网络获取。`);

  const normalizeUrl = (url: string) => (url.startsWith('//') ? `https:${url}` : url);
  const url = getUrlFromId(id);
  const html = await fetch(url)
    .then((data) => data.text())
    .catch(() => void 0);

  if (!html) {
    return;
  }

  const $ = loadHtml(html);
  const title = $('#bookName').text().trim();
  const introEl = $('#book-intro-detail');
  const intro =
    introEl
      .html()
      ?.trim()
      .replace(/ *<br> */g, '\n') ?? introEl.text().trim();
  const author = $('.writer-name');
  const authorName = author.text().trim();
  const authorUrl = normalizeUrl(author.attr('href')?.trim() ?? '');
  const coverOriginUrl = normalizeUrl($('#bookImg img').attr('src')?.trim() ?? '');
  const coverImg = await fetch(coverOriginUrl)
    .then((data) => data.arrayBuffer())
    .then((data) => Buffer.from(data))
    .catch(() => void 0);

  if (!title || !intro || !authorName || !authorUrl || !coverImg) {
    RuntimeBuilder.logger.error(`从网络获取书籍 ${id} 数据出错，请检查你的网络。`);
    return;
  }

  const coverImgKind = (imageCheck(coverImg).type ?? 'jpg').toLowerCase();
  const coverUrl = RuntimeBuilder.renameAsset({
    path: `${id}.${coverImgKind}`,
    content: coverImg,
  });

  if (!coverUrl) {
    throw new Error(`书籍封面重命名出错：${coverImgKind}`);
  }

  const bookCache: BookCache = {
    title,
    intro,
    url,
    authorName,
    authorUrl,
    coverUrl,
  };
  const bookData: BookData = {
    ...bookCache,
    cover: coverImg,
  };

  RuntimeBuilder.logger.debug(`书籍 ${id} 从网络获取数据成功，写入缓存。`);

  const cachePath = getCacheFilePath(id);
  const builderCache = RuntimeBuilder.getCacheAccessor(ComponentName);

  await Promise.all([
    builderCache.write(cachePath.meta, JSON.stringify(bookCache)),
    builderCache.write(cachePath.cover, coverImg),
  ]);

  return bookData;
}

export function getBookDataForUI(id: number) {
  return bookMap.get(id);
}

export async function getBookData(id: number) {
  if (bookMap.has(id)) {
    return bookMap.get(id)!;
  }

  // 获取数据
  const data = (await getBookDataFromDisk(id)) ?? (await getBookDataFromUrl(id));

  if (data) {
    bookMap.set(id, data);
  }

  return data;
}
