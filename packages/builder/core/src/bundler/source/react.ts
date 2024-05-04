import { AnyObject } from '@xiao-ai/utils';

import { renderToString } from 'react-dom/server';
import { ReactNode, createElement } from 'react';
import { publicPath, archivePath, tagPath, aboutPath } from '../../constant';

export function createHtml<T extends AnyObject>(
  render: (param: T) => ReactNode,
): (param: Omit<T, 'archivePath' | 'tagPath' | 'aboutPath'>) => string {
  const prefix = '<!DOCTYPE html>';
  return (param: Omit<T, 'archivePath' | 'tagPath' | 'aboutPath'>) => {
    return (
      prefix +
      renderToString(
        createElement(render as any, {
          publicPath,
          archivePath,
          tagPath,
          aboutPath,
          ...param,
        }),
      )
    );
  };
}
