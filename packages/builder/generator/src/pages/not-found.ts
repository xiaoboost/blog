import { normalize } from '@blog/node';
import { NotFound } from '@blog/template-layout';
import type { IRenderContext, ISite } from '@blog/types';
import { Page } from '../model/page';
import { createHtml } from '../utils/react';

const createNotFound = createHtml(NotFound);

function renderNotFoundPage(ctx: IRenderContext<'not-found'>) {
  return createNotFound({ ...ctx });
}

export function getNotFoundUrlPath(site: ISite) {
  return normalize(site.publicPath, '404.html');
}

export function createNotFoundPage(site: ISite) {
  const pathname = getNotFoundUrlPath(site);
  return new Page({
    type: 'not-found',
    pathname,
    outputPath: pathname,
    title: `页面未找到 · ${site.title}`,
    data: {},
    render: renderNotFoundPage,
  });
}
