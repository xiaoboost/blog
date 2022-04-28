import { AnyObject } from '@xiao-ai/utils';

import { renderToString } from 'react-dom/server';
import { ReactNode, createElement } from 'react';
import { getCliOptions } from '@blog/utils';

export interface Options {
  outDir: string;
  development?: boolean;
}

export function createHtml<T extends AnyObject>(
  render: (param: T) => ReactNode,
): (param: T) => string {
  const prefix = '<!DOCTYPE html>';
  return (param: T) => {
    return prefix + renderToString(createElement(render as any, param));
  };
}

export const options = getCliOptions<Options>();
