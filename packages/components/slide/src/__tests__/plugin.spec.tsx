import { rejects } from 'node:assert/strict';
import { callHook, waitReady } from '@blog/context/runtime';
import { describe, expect, it } from '@blog/test-toolkit';
import React from 'react';
import {
  Animate,
  FadeIn,
  Parallel,
  Player,
  Sequence,
  Step,
  Wait,
} from '../animation';
import { slideConfigs } from '../slide/collect/plugin';
import { Section } from '../slide/section';
import { Slide } from '../slide/slide';
import {
  buildContext,
  page,
  renderContext,
  renderPage,
} from './fixtures';

describe('动画资源构建插件', () => {
  it('嵌套编排通过构建插件登记为时间表，保留触发边界与纯等待时长', async () => {
    await waitReady;
    const context = renderContext();
    const build = buildContext(context);
    await callHook('afterReady', build);
    renderPage(page(
      <Player>
        <Step />
        <Step>
          <Parallel id="anchor" at={200}>
            <FadeIn target="a" transition={{ duration: 300, delay: 50 }} />
          </Parallel>
          <Sequence at={{ ref: 'anchor', edge: 'end', offset: -100 }}>
            <Animate target="b" to={{ opacity: 1 }} transition={{ duration: 100 }} />
            <Wait duration={200} />
          </Sequence>
        </Step>
        <Step><Wait duration={100} /></Step>
      </Player>,
    ), context);
    await callHook('beforeBuild', build);
    expect(context.page.getBrowserConfig().slide).deep.eq({
      sections: [
        {
          steps: [
            { duration: 0, actions: [] },
            {
              duration: 750,
              actions: [
                {
                  target: 'a',
                  start: 250,
                  keyframes: [{ opacity: 0 }, { opacity: 1 }],
                  before: { visibility: 'visible' },
                  transition: { duration: 300, easing: 'ease-out' },
                },
                {
                  target: 'b',
                  start: 450,
                  keyframes: [{ opacity: 1 }],
                  transition: { duration: 100, easing: 'ease-out' },
                },
              ],
            },
            { duration: 100, actions: [] },
          ],
        },
      ],
    });
  });

  it('构建钩子只登记页面配置，文件和 head 引用留给生成器', async () => {
    await waitReady;
    const context = renderContext();
    const build = buildContext(context);
    await callHook('afterReady', build);
    renderPage(page(<Player><Step><FadeIn target="title" /></Step></Player>), context);
    await callHook('beforeBuild', build);
    expect(context.page.getBrowserConfig().slide).eq(slideConfigs.get(context.page));
    expect(context.page.getAssets()).length(0);
    expect(context.page.getPreScripts()).length(0);
    context.isPreBuild = false;
    renderPage(page(<Player><Step><FadeIn target="title" /></Step></Player>), context);
    expect(context.page.getBrowserConfig().slide).eq(slideConfigs.get(context.page));
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

  it('不同页面分别登记配置，保留没有动画的页面位置', async () => {
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
    const a = first.page.getBrowserConfig().slide!;
    const b = second.page.getBrowserConfig().slide!;
    expect(a.sections[0]).deep.eq({ steps: [] });
    expect(a.sections[1].steps[0].actions[0].target).eq('second');
    expect(b.sections[0].steps[0].actions[0].target).eq('other');
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

  it('配置中的引号、换行和脚本文本保持原值', async () => {
    await waitReady;
    const context = renderContext();
    const build = buildContext(context);
    const text = ['";globalThis.injected=true;//', '</script>\\'].join('\n');
    await callHook('afterReady', build);
    renderPage(page(
      <Player><Step><Animate target={text} to={{ content: text }} /></Step></Player>,
    ), context);
    await callHook('beforeBuild', build);
    const action = context.page.getBrowserConfig().slide!.sections[0].steps[0].actions[0];
    expect(action.target).eq(text);
    expect(action.keyframes[0].content).eq(text);
  });
});
