import { rejects } from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { callHook, waitReady } from '@blog/context/runtime';
import { describe, expect, it } from '@blog/test-toolkit';
import React from 'react';
import {
  Animate,
  FadeIn,
  Player,
  Step,
} from '../animation';
import { SlideConfigGlobalKey, SlideConfigReadyEvent } from '../shared';
import { slideConfigs } from '../slide/collect/plugin';
import { Section } from '../slide/section';
import { Slide } from '../slide/slide';
import {
  buildContext,
  page,
  renderContext,
  renderPage,
} from './fixtures';

function browserContext(): Record<string, any> {
  const events = new EventTarget();
  return {
    Event,
    dispatchEvent: events.dispatchEvent.bind(events),
    addEventListener: events.addEventListener.bind(events),
  };
}

describe('动画资源构建插件', () => {
  it('通过普通构建钩子生成外部配置脚本，并使用重命名后的路径上报', async () => {
    await waitReady;
    const context = renderContext();
    const build = buildContext(context);
    build.rename = (asset) => {
      expect(asset.path).eq('slide-data.js');
      expect(asset.content.toString()).include(SlideConfigGlobalKey);
      return 'scripts/slide-data.hash.js';
    };
    await callHook('afterReady', build);
    const html = renderPage(page(<Player><Step><FadeIn target="title" /></Step></Player>), context);
    const config = slideConfigs.get(context.page);
    expect(context.page.getAssets()).length(0);
    expect(html).not.include('<script');

    await callHook('beforeBuild', build);
    const assets = context.page.getAssets();
    expect(assets).length(1);
    expect(assets[0].path).eq('/slides/example/scripts/slide-data.hash.js');
    expect(context.page.getPreScripts()).deep.eq([{ src: assets[0].path, async: true }]);
    const browser = browserContext();
    let notified = false;
    browser.addEventListener(SlideConfigReadyEvent, () => {
      expect(browser[SlideConfigGlobalKey]).deep.eq(config);
      notified = true;
    });
    runInNewContext(assets[0].content.toString(), browser);
    expect(browser[SlideConfigGlobalKey]).deep.eq(config);
    expect(notified).eq(true);

    context.isPreBuild = false;
    renderPage(page(<Player><Step><FadeIn target="title" /></Step></Player>), context);
    expect(context.page.getAssets()).length(1);
    expect(slideConfigs.get(context.page)).eq(config);
  });

  it('未包含 Slide 的 slide 模板在构建钩子里报错', async () => {
    await waitReady;
    const context = renderContext();
    const build = buildContext(context);
    await callHook('afterReady', build);
    renderPage(<div>没有 PPT 根组件</div>, context);
    await rejects(async () => callHook('beforeBuild', build), /必须包含一个 Slide/);
    expect(context.page.getAssets()).length(0);
  });

  it('普通文章没有动画配置时不生成资源', async () => {
    await waitReady;
    const context = renderContext();

    if (context.page.type === 'post') {
      context.page.data.post.data.template = 'post';
    }

    const build = buildContext(context);
    await callHook('afterReady', build);
    renderPage(<div>文章</div>, context);
    await callHook('beforeBuild', build);
    expect(context.page.getAssets()).length(0);
    expect(context.page.getPreScripts()).length(0);
  });

  it('不同页面分别输出配置，保留没有动画的页面位置', async () => {
    await waitReady;
    const first = renderContext();
    const second = renderContext();
    const build = buildContext(first, second);
    await callHook('afterReady', build);
    renderPage(
      <Slide>
        <Section>静态页</Section>
        <Section><Player><Step><FadeIn target="second" /></Step></Player></Section>
      </Slide>, first);
    renderPage(page(<Player><Step><FadeIn target="other" /></Step></Player>), second);
    await callHook('beforeBuild', build);
    const a = browserContext();
    const b = browserContext();
    runInNewContext(first.page.getAssets()[0].content.toString(), a);
    runInNewContext(second.page.getAssets()[0].content.toString(), b);
    expect(a.__BLOG_SLIDE_CONFIG__.sections[0]).deep.eq({ steps: [] });
    expect(a.__BLOG_SLIDE_CONFIG__.sections[1].steps[0].actions[0].target).eq('second');
    expect(b.__BLOG_SLIDE_CONFIG__.sections[0].steps[0].actions[0].target).eq('other');
  });

  it('新一轮构建清理旧配置，删除 Slide 后不会复用旧数据', async () => {
    await waitReady;
    const context = renderContext();
    const build = buildContext(context);
    await callHook('afterReady', build);
    renderPage(page(<Player><Step><FadeIn target="old" /></Step></Player>), context);
    expect(slideConfigs.has(context.page)).eq(true);
    await callHook('afterReady', build);
    expect(slideConfigs.has(context.page)).eq(false);
    renderPage(<div>已删除 Slide</div>, context);
    await rejects(async () => callHook('beforeBuild', build), /必须包含一个 Slide/);
    await callHook('afterReady', build);
    renderPage(page(<Player><Step><FadeIn target="new" /></Step></Player>), context);
    await callHook('beforeBuild', build);
    expect(slideConfigs.get(context.page)!.sections[0].steps[0].actions[0].target).eq('new');
  });

  it('配置中的引号、换行和脚本文本作为数据还原', async () => {
    await waitReady;
    const context = renderContext();
    const build = buildContext(context);
    const text = ['";globalThis.injected=true;//', '</script>\\'].join('\n');
    await callHook('afterReady', build);
    renderPage(page(
      <Player><Step><Animate target={text} to={{ content: text }} /></Step></Player>,
    ), context);
    await callHook('beforeBuild', build);
    const browser = browserContext();
    runInNewContext(context.page.getAssets()[0].content.toString(), browser);
    expect(browser.injected).eq(undefined);
    const action = browser.__BLOG_SLIDE_CONFIG__.sections[0].steps[0].actions[0];
    expect(action.target).eq(text);
    expect(action.keyframes[0].content).eq(text);
  });
});
