import './styles/index.styl';
import './plugins';

import { ReactNode, createElement } from 'react';
import { renderToString } from 'react-dom/server';

import { AnyObject } from '@xiao-ai/utils';

import { Render as IndexRender } from './views/index';
import { Render as PostRender } from './views/post';

function fixHtml<T extends AnyObject>(
  render: (param: T) => ReactNode,
): (param: T) => string {
  const prefix = '<!DOCTYPE html>';
  return (param: T) => {
    return prefix + renderToString(createElement(render as any, param));
  };
}

export const Index = fixHtml(IndexRender);
export const DefaultPost = fixHtml(PostRender);
