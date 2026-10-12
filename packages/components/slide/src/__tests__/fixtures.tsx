import { RenderContext } from '@blog/context/runtime';
import type { IRenderContext } from '@blog/types';
import React, { type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { collectSlide } from '../slide/collect';
import { Section } from '../slide/section';
import { Slide } from '../slide/slide';

export function renderContext(): IRenderContext {
  return {
    page: {} as IRenderContext['page'],
    site: {} as IRenderContext['site'],
    dev: false,
    isPreBuild: true,
  };
}

export function renderPage(children: ReactNode, context: IRenderContext): string {
  return renderToStaticMarkup(
    <RenderContext.Provider value={context}>{children}</RenderContext.Provider>,
  );
}

export function collect(children: ReactNode, context = renderContext()) {
  return collectSlide(context.page, () => renderPage(children, context));
}

export function page(animation: ReactNode, content: ReactNode = <div id="title">标题</div>) {
  return (
    <Slide>
      <Section>
        {content}
        {animation}
      </Section>
    </Slide>
  );
}
