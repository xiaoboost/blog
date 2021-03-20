import { ReactNode, createElement } from 'react';
import { renderToString } from 'react-dom/server';

import { AnyObject } from '@blog/utils';

import { Render as IndexRender } from './views/index';
import { Render as DefaultPostRender } from './views/post/default';

function fixHtml<T extends AnyObject>(
  render: (param: T) => ReactNode,
): (param: T) => string {
  const prefix = '<!DOCTYPE html>';
  return (param: T) => {
    return prefix + renderToString(createElement(render as any, param));
  };
}

export const Index = fixHtml(IndexRender);
export const DefaultPost = fixHtml(DefaultPostRender);
