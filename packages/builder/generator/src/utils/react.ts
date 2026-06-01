import { RenderContext } from '@blog/context/runtime';
import type { IRenderContext } from '@blog/types';
import type { AnyObject } from '@xiao-ai/utils';
import { type ReactNode, createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { archivePath, tagPath, aboutPath } from '../constant';

export function createHtml<T extends AnyObject>(
  render: (param: T) => ReactNode,
): (param: Omit<T, 'archivePath' | 'tagPath' | 'aboutPath'> & Partial<IRenderContext>) => string {
  const prefix = '<!DOCTYPE html>';
  return (param: Record<string, unknown>) => {
    return (
      prefix
      + renderToString(
        createElement(
          RenderContext.Provider,
          {
            value: {
              page: param.page,
              site: param.site,
              dev: param.dev ?? false,
              isPreBuild: param.isPreBuild ?? false,
            } as IRenderContext,
          },
          createElement(render as any, {
            archivePath,
            tagPath,
            aboutPath,
            ...param,
          }),
        ),
      )
    );
  };
}
