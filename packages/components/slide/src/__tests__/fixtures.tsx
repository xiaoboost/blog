import { RenderContext, mergeBrowserConfig, waitReady } from '@blog/context/runtime';
import type {
  BrowserConfig,
  AssetData,
  BuildContext,
  IRenderContext,
  ScriptAssetData,
} from '@blog/types';
import { before } from 'mocha';
import React, { type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useSlideStore, type ISlideStore } from '../slide/collect/context';
import { Section } from '../slide/section';
import { Slide } from '../slide/slide';
import type { SlideProps } from '../slide/types';

before(() => waitReady);

export function renderContext(): IRenderContext {
  const configs: BrowserConfig[] = [];
  const assets: AssetData[] = [];
  const scripts: ScriptAssetData[] = [];
  return {
    page: {
      addBrowserConfig: (config: BrowserConfig) => configs.push(config),
      getBrowserConfig: () => mergeBrowserConfig(...configs),
      type: 'post',
      pathname: '/slides/example/',
      data: { post: { data: { template: 'slide' } } },
      addAsset: (asset: AssetData) => assets.push(asset),
      getAssets: () => assets.slice(),
      addPreScript: (script: ScriptAssetData) => scripts.push(script),
      getPreScripts: () => scripts.slice(),
    } as unknown as IRenderContext['page'],
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
  let store: ISlideStore | undefined;
  function CaptureStore() {
    store = useSlideStore();
    return null;
  }

  const tree = React.isValidElement<SlideProps>(children) && children.type === Slide
    ? React.cloneElement(children, undefined, <CaptureStore />, children.props.children)
    : children;
  const html = renderPage(tree, context);

  if (!store) {
    throw new Error('测试未取得 Slide store');
  }

  return { html, config: store.getConfig() };
}

export function buildContext(...contexts: IRenderContext[]): BuildContext {
  return {
    pages: contexts.map(({ page }) => page),
    site: contexts[0].site,
    logger: console,
    rename: ({ path }) => `scripts/${path}`,
  };
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
