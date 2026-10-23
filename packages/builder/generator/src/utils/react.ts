import { RenderContext } from '@blog/context/runtime';
import type { IRenderContext } from '@blog/types';
import type { AnyObject } from '@xiao-ai/utils';
import { type ReactNode, createElement } from 'react';
import { renderToString } from 'react-dom/server';

export function createHtml<T extends AnyObject>(
  render: (param: T) => ReactNode,
): (param: T & IRenderContext) => string {
  const prefix = '<!DOCTYPE html>';
  return (props) => {
    const {
      page,
      site,
      dev,
      isPreBuild,
    } = props;
    return (
      prefix
      + renderToString(
        createElement(
          RenderContext.Provider,
          {
            value: {
              page,
              site,
              dev,
              isPreBuild,
            },
          },
          createElement(render, props),
        ),
      )
    );
  };
}
