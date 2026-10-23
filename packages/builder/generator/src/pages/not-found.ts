import { normalize } from '@blog/node';
import { NotFound } from '@blog/template-layout';
import type { ISite } from '@blog/types';
import { createHtml } from '../utils/react';

export function getNotFoundUrlPath(site: ISite) {
  return normalize(site.publicPath, '404.html');
}

export const renderNotFoundPage = createHtml(NotFound);
