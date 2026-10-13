import { RenderContext } from '@blog/context/runtime';
import type {
  AssetData,
  BuildContext,
  IRenderContext,
  ScriptAssetData,
} from '@blog/types';
import React, { type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { slideConfigs } from '../slide/collect/plugin';
import { Section } from '../slide/section';
import { Slide } from '../slide/slide';

export function renderContext(): IRenderContext {
  const assets: AssetData[] = [];
  const scripts: ScriptAssetData[] = [];
  return {
    page: {
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
  // 测试辅助：模拟新一轮构建，并读取组件登记的结果。
  slideConfigs.delete(context.page);
  const html = renderPage(children, context);
  const config = slideConfigs.get(context.page);

  if (!config) {
    throw new Error('测试未取得预渲染配置');
  }

  return { html, config };
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
