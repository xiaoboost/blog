import type { IBuildRenderProps } from '@blog/types';
import type { AnyObject } from '@xiao-ai/utils';
import { type ReactNode, createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { archivePath, tagPath, aboutPath } from './constant';

export function createHtml<T extends AnyObject>(
  render: (param: T) => ReactNode,
): (param: Omit<T, 'archivePath' | 'tagPath' | 'aboutPath'> & Partial<IBuildRenderProps>) => string {
  const prefix = '<!DOCTYPE html>';
  return (param: Record<string, unknown>) => {
    return (
      prefix
      + renderToString(
        createElement(render as any, {
          archivePath,
          tagPath,
          aboutPath,
          ...param,
        }),
      )
    );
  };
}
