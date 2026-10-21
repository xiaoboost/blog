import { useRenderOnce } from '@blog/context/runtime';
import { describe, expect, it } from '@blog/test-toolkit';
import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  Player,
  Step,
  Animate,
  FadeIn,
  FadeOut,
  MoveIn,
  ScaleIn,
} from '../animation';
import { mergeTransition } from '../animation/normalize';
import type { AnimationState } from '../animation/types';
import { SlideStoreContext, type ISlideStore } from '../slide/collect/context';
import { slideConfigs } from '../slide/collect/plugin';
import { Section } from '../slide/section';
import { Slide } from '../slide/slide';
import {
  collect,
  page,
  renderContext,
  renderPage,
} from './fixtures';

describe('transition 字段继承', () => {
  it('动作优先于 Step，Step 优先于 Player；undefined 继承而 0 覆盖', () => {
    const player = { duration: 800, delay: 100, easing: 'linear' };
    const step = { duration: 500, delay: undefined };
    const action = { duration: 0, delay: 0, easing: undefined };
    expect(mergeTransition(player, step, action)).deep.eq({ duration: 0, delay: 0, easing: 'linear' });
    expect(player).deep.eq({ duration: 800, delay: 100, easing: 'linear' });
    expect(mergeTransition()).deep.eq({ duration: 300, delay: 0, easing: 'ease-out' });
  });
});

describe('SSR 动画收集', () => {
  it('无 id 的页及没有动画的页都可收集，顺序与页码一致', () => {
    const { html, config } = collect(
      <Slide>
        <Section title="开场"><h1>开场</h1></Section>
        <Section>第二页</Section>
      </Slide>,
    );
    expect(config).deep.eq({
      sections: [{ steps: [] }, { steps: [] }],
    });
    expect(html).include('data-slide-section="0"').include('data-slide-section="1"');
    expect(html).not.include('<script').not.match(/<section[^>]*\sid=/);
  });

  it('支持有 Hook 的自定义封装、Fragment 和循环，保留步骤及动作顺序', () => {
    const TargetContext = createContext('');
    function Action() {
      return <FadeIn target={useContext(TargetContext)} />;
    }
    function Steps() {
      return <>{['one', 'two'].map((id) => <Step key={id}><TargetContext.Provider value={id}><Action /></TargetContext.Provider></Step>)}</>;
    }
    const { html, config } = collect(page(<Player><Steps /></Player>,
      <>
        <div id="one" />
        <svg><g id="two" /></svg>
      </>,
    ));
    expect(config.sections[0].steps.map((step) => step.actions[0].target)).deep.eq(['one', 'two']);
    expect(html).not.include('Player').not.include('Step').not.include('Animate').not.include('<script');
  });

  it('效果封装不覆盖继承时间，并记录开始显现 / 结束隐藏的离散状态', () => {
    const { config } = collect(page(
      <Player transition={{ duration: 900, easing: 'linear' }}>
        <Step transition={{ duration: 500 }}><FadeIn target="title" transition={{ delay: 0 }} /></Step>
        <Step><FadeOut target="title" transition={{ duration: 0 }} /></Step>
      </Player>,
    ));
    const [enter, exit] = config.sections[0].steps.map((step) => step.actions[0]);
    expect(enter).deep.eq({
      target: 'title',
      start: 0,
      keyframes: [{ opacity: 0 }, { opacity: 1 }],
      before: { visibility: 'visible' },
      transition: { duration: 500, easing: 'linear' },
    });
    expect(exit).deep.eq({
      target: 'title',
      start: 0,
      keyframes: [{ opacity: 0 }],
      after: { visibility: 'hidden' },
      transition: { duration: 0, easing: 'linear' },
    });
  });

  it('同一目标不同属性允许同时变化，相同属性在不同 Step 中允许复用', () => {
    const { config } = collect(page(
      <Player>
        <Step>
          <Animate target="title" to={{ opacity: 1 }} />
          <Animate target="title" to={{ color: 'red' }} />
        </Step>
        <Step><Animate target="title" to={{ opacity: 0 }} /></Step>
      </Player>,
    ));
    expect(config.sections[0].steps.map(({ actions }) => actions.length)).deep.eq([2, 1]);
  });

  it('移动和缩放关闭 fade 时不写 opacity；origin 单独作为开始前样式记录', () => {
    const { config } = collect(page(
      <Player>
        <Step>
          <MoveIn
            target="title"
            direction="left"
            distance={0}
            fade={false}
          />
        </Step>
        <Step>
          <ScaleIn
            target="title"
            scale={0}
            origin="left top"
            fade={false}
          />
        </Step>
      </Player>,
    ));
    const [move, scale] = config.sections[0].steps.map((step) => step.actions[0]);
    expect(move.keyframes).deep.eq([{ translate: '0px 0px' }, { translate: '0px 0px' }]);
    expect(scale.before).deep.eq({ visibility: 'visible', transformOrigin: 'left top' });
    expect(scale.keyframes).deep.eq([{ scale: 0 }, { scale: 1 }]);
  });

  it('target 原样记录，不解析 HTML 查找目标', () => {
    const id = 'title&detail';
    const { config } = collect(page(
      <Player><Step><FadeIn target={id} /></Step></Player>,
      <div>目标将在播放时绑定</div>,
    ));
    expect(config.sections[0].steps[0].actions[0].target).eq(id);
  });

  it('修改来源配置不会改变已收集的数据，不同预渲染互不串页', () => {
    const to = { opacity: 1 };
    const first = collect(page(<Player><Step><Animate target="title" to={to} /></Step></Player>)).config;
    to.opacity = 0;
    const second = collect(<Slide><Section>无动画</Section></Slide>).config;
    expect(first.sections[0].steps[0].actions[0].keyframes[0].opacity).eq(1);
    expect(second.sections).deep.eq([{ steps: [] }]);
  });

  it('正式渲染不展开动画子树、不再次收集，也不输出资源标签', () => {
    function MustNotRender(): never {
      throw new Error('正式渲染不应执行动画子树');
    }
    const html = renderToStaticMarkup(page(<Player><MustNotRender /></Player>));
    expect(html).include('标题').not.include('<script');
  });

  it('Slide 提供登记函数，同一元素的两轮 SSR 使用独立配置和栈', () => {
    const contexts: ISlideStore[] = [];
    function Probe() {
      const context = useContext(SlideStoreContext);

      if (!context) {
        throw new Error('Slide 后代应该能取得其登记函数');
      }

      contexts.push(context);
      return <div id="title">标题</div>;
    }
    const tree = page(<Player><Step><FadeIn target="title" /></Step></Player>, <Probe />);
    const first = collect(tree);
    const second = collect(tree);
    expect(contexts).length(2);
    expect(contexts[0]).not.eq(contexts[1]);
    expect(first.config.sections[0].steps[0].actions[0].target).eq('title');
    expect(second.config).deep.eq(first.config);
  });

  it('普通 SSR 即可登记配置，Slide 完成前不发布', () => {
    const context = renderContext();
    let renders = 0;
    function Probe() {
      renders++;
      expect(slideConfigs.has(context.page)).eq(false);
      return <div id="title" />;
    }
    const html = renderPage(page(<Player><Step><FadeIn target="title" /></Step></Player>, <Probe />), context);
    expect(renders).eq(1);
    expect(slideConfigs.get(context.page)!.sections[0].steps).length(1);
    expect(html).include('id="title"').not.include('<script');
    expect(() => collect(<Slide>{null}</Slide>)).throw(/至少一个 Section/);
  });

  it('各页的 Player 和默认 transition 独立，结束标记不生成 HTML', () => {
    const { html, config } = collect(
      <Slide>
        <Section>
          <div id="first" />
          <Player transition={{ duration: 800 }}>
            <Step transition={{ duration: 500 }}><FadeIn target="first" /></Step>
            <Step><FadeOut target="first" /></Step>
          </Player>
        </Section>
        <Section>
          <div id="second" />
          <Player><Step><FadeIn target="second" /></Step></Player>
        </Section>
      </Slide>,
    );
    const durations = config.sections.map(({ steps }) => (
      steps.map(({ actions }) => actions[0].transition.duration)
    ));
    expect(durations).deep.eq([[500, 800], [300]]);
    expect(html).not.include('ScopeEnd').not.include('<script');
  });

  it('渲染失败不发布半成品配置，下一轮预渲染可重新收集', () => {
    const context = renderContext();
    function Broken(): never {
      throw new Error('渲染失败');
    }
    expect(() => renderPage(page(<Player><Step><Broken /></Step></Player>), context)).throw(/渲染失败/);
    expect(slideConfigs.has(context.page)).eq(false);
    expect(() => collect(page(<Player>{null}</Player>), context)).throw(/至少需要一个 Step/);
    expect(collect(page(<Player><Step><FadeIn target="title" /></Step></Player>), context)
      .config.sections[0].steps).length(1);
  });

  it('不同页面的普通 SSR 配置互不影响', () => {
    const outer = renderContext();
    const inner = renderContext();
    function NestedRender() {
      renderPage(
        <Slide>
          <Section>内页</Section>
          <Section>内页第二页</Section>
        </Slide>, inner);
      return null;
    }
    renderPage(
      <Slide>
        <Section>
          <NestedRender />
          外页
        </Section>
      </Slide>, outer);
    expect(slideConfigs.get(outer.page)!.sections).length(1);
    expect(slideConfigs.get(inner.page)!.sections).length(2);
  });

  it('正式渲染不覆盖预渲染配置，也不要求外部收集入口', () => {
    const context = renderContext();
    renderPage(page(<Player><Step><FadeIn target="title" /></Step></Player>), context);
    const config = slideConfigs.get(context.page);
    context.isPreBuild = false;
    const html = renderPage(<Slide><Section>正式内容</Section></Slide>, context);
    expect(slideConfigs.get(context.page)).eq(config);
    expect(html).include('正式内容').not.include('<script');
  });

  it('栈内的范围必须按顺序结束，结束前不能取得最终配置', () => {
    function Probe() {
      const context = useContext(SlideStoreContext)!;
      expect(() => context.end('player')).throw(/范围没有按顺序结束/);
      expect(() => context.getConfig()).throw(/范围尚未结束/);
      return <div id="title" />;
    }
    expect(collect(page(<Player><Step><FadeIn target="title" /></Step></Player>, <Probe />))
      .config.sections[0].steps).length(1);
  });

  it('同一步按上报顺序保存动作，不额外分析样式冲突', () => {
    const { config } = collect(page(
      <Player>
        <Step>
          <FadeIn target="title" />
          <FadeOut target="title" />
        </Step>
      </Player>,
    ));
    const actions = config.sections[0].steps[0].actions;
    expect(actions.map(({ keyframes }) => keyframes.at(-1)!.opacity)).deep.eq([1, 0]);
  });

  it('id / title 只保留在 DOM，收集的页面与步骤按实际渲染顺序排列', () => {
    const { html, config } = collect(
      <Slide>
        {false && <Section>不存在</Section>}
        <Section id="cover" title="封面">封面</Section>
        <Section title="正文">
          <Player>
            {[1, 2].map((index) => <Step key={index}><Animate target="title" to={{ width: index * 100 }} /></Step>)}
          </Player>
        </Section>
      </Slide>,
    );
    expect(config.sections[0]).deep.eq({ steps: [] });
    expect(config.sections[1]).not.have.property('title');
    const widths = config.sections[1].steps.map(({ actions }) => actions[0].keyframes[0].width);
    expect(widths).deep.eq([100, 200]);
    expect(html).include('id="cover"').include('data-slide-title="封面"');
    expect(html).include('data-slide-section="0"').include('data-slide-section="1"');
  });

  it('接受完整 CSS 样式与 before / after，统一关键帧并保留 0 和原始单位', () => {
    const { config } = collect(page(
      <Player>
        <Step>
          <Animate
            target="title"
            from={{ width: 0, filter: 'blur(8px)', clipPath: 'inset(0 100% 0 0)' }}
            to={{
              width: 120,
              filter: 'none',
              borderRadius: '1em',
              opacity: '50%',
              fontWeight: 700,
            }}
            before={{ display: 'block', zIndex: 0, transformOrigin: 'left top' }}
            after={{ pointerEvents: 'none', color: 'var(--color-text-primary)' }}
          />
        </Step>
      </Player>,
    ));
    const action = config.sections[0].steps[0].actions[0];
    expect(action.keyframes).deep.eq([
      { width: 0, filter: 'blur(8px)', clipPath: 'inset(0 100% 0 0)' },
      {
        width: 120,
        filter: 'none',
        borderRadius: '1em',
        opacity: '50%',
        fontWeight: 700,
      },
    ]);
    expect(action.before).deep.eq({ display: 'block', zIndex: 0, transformOrigin: 'left top' });
    expect(action.after).deep.eq({ pointerEvents: 'none', color: 'var(--color-text-primary)' });
    expect(action).not.have.property('from');
    expect(action).not.have.property('to');
    expect(JSON.parse(JSON.stringify(config))).deep.eq(config);
  });

  it('只给 to 时保持起点未指定，多段关键帧保持顺序且继承 transition', () => {
    const frames = Object.freeze([
      Object.freeze({ scale: 1 }),
      Object.freeze({ scale: 1.2 }),
      Object.freeze({ scale: 1 }),
    ]);
    const { config } = collect(page(
      <Player transition={{ duration: 900, delay: 10 }}>
        <Step transition={{ duration: 400 }}>
          <Animate target="title" to={{ color: 'red', margin: undefined }} />
          <Animate target="title" keyframes={frames} transition={{ delay: 0 }} />
        </Step>
      </Player>,
    ));
    const [single, multiple] = config.sections[0].steps[0].actions;
    expect(single.keyframes).deep.eq([{ color: 'red' }]);
    expect(single.start).eq(10);
    expect(single.transition).deep.eq({ duration: 400, easing: 'ease-out' });
    expect(multiple.keyframes).deep.eq(frames);
    expect(multiple.start).eq(0);
    expect(multiple.transition).deep.eq({ duration: 400, easing: 'ease-out' });
  });

  it('输入数组、阶段样式和 transition 都复制；取得配置也不会暴露可修改的 store 数据', () => {
    const keyframes = [{ scale: 1 }, { scale: 2 }];
    const before: AnimationState = { display: 'block' };
    const after = { opacity: 0 };
    const transition = { duration: 450 };
    let store: ISlideStore;
    function Probe() {
      store = useContext(SlideStoreContext)!;
      return null;
    }
    const { config } = collect(page(
      <Player>
        <Step>
          <Animate
            target="title"
            keyframes={keyframes}
            before={before}
            after={after}
            transition={transition}
          />
        </Step>
      </Player>, <Probe />));
    keyframes[1].scale = 9;
    keyframes.push({ scale: 10 });
    before.display = 'none';
    after.opacity = 1;
    transition.duration = 1;
    const action = config.sections[0].steps[0].actions[0];
    expect(action.keyframes).deep.eq([{ scale: 1 }, { scale: 2 }]);
    expect(action.before).deep.eq({ display: 'block' });
    expect(action.after).deep.eq({ opacity: 0 });
    expect(action.transition.duration).eq(450);
    action.keyframes[1].scale = 20;
    action.before!.display = 'none';
    action.transition.duration = 0;
    action.start = 999;
    config.sections[0].steps[0].duration = 999;
    const step = store!.getConfig().sections[0].steps[0];
    const again = step.actions[0];
    expect(again.keyframes[1].scale).eq(2);
    expect(again.before!.display).eq('block');
    expect(again.transition.duration).eq(450);
    expect(again.start).eq(0);
    expect(step.duration).eq(450);
  });

  it('useRenderOnce 在同一 SSR 组件内部重新渲染时只登记一次动作', () => {
    let registrations = 0;
    function Retry() {
      const store = useContext(SlideStoreContext)!;
      const [ready, setReady] = useState(false);
      useRenderOnce(() => {
        registrations++;
        store.addAction({ target: 'title', to: { opacity: 1 } });
      });

      if (!ready) {
        setReady(true);
      }

      return null;
    }
    const { config } = collect(page(<Player><Step><Retry /></Step></Player>));
    expect(config.sections[0].steps[0].actions).length(1);
    expect(registrations).eq(1);
  });

  it('部分动作已登记后渲染失败，同一页面的下一轮收集仍干净', () => {
    const context = renderContext();
    function Broken(): never {
      throw new Error('动作之后失败');
    }
    expect(() => collect(page(
      <Player>
        <Step>
          <FadeIn target="title" />
          <Broken />
        </Step>
      </Player>,
    ), context))
      .throw(/动作之后失败/);
    const { config } = collect(<Slide><Section title="重试">成功</Section></Slide>, context);
    expect(config.sections).deep.eq([{ steps: [] }]);
  });

  it('正式渲染也拒绝同页多个 Player', () => {
    const tree = page(
      <>
        <Player>{null}</Player>
        <Player>{null}</Player>
      </>,
    );
    expect(() => renderToStaticMarkup(tree)).throw(/多个 Player/);
  });
});

describe('不符合规范时构建报错', () => {
  const invalidTrees: [string, ReactNode, RegExp][] = [
    [
      '整篇多个 Slide',
      (
        <>
          <Slide><Section>一页</Section></Slide>
          <Slide><Section>另一页</Section></Slide>
        </>
      ),
      /只能包含一个 Slide/,
    ],
    ['嵌套 Slide', <Slide><Section><Slide><Section>内页</Section></Slide></Section></Slide>, /Slide 不能嵌套/],
    ['嵌套 Section', <Slide><Section><Section>内页</Section></Section></Slide>, /Section 不能嵌套/],
    ['Player 没有 Section', <Slide><Player><Step><FadeIn target="title" /></Step></Player></Slide>, /Player 必须属于/],
    ['Section 没有 Slide', <Section>一页</Section>, /PPT 组件必须属于 Slide/],
    [
      '同页多个 Player',
      page(
        <>
          <Player><Step><FadeIn target="title" /></Step></Player>
          <Player><Step><FadeOut target="title" /></Step></Player>
        </>,
      ),
      /第 1 页发现多个 Player/,
    ],
    ['嵌套 Player', page(<Player><Player><Step><FadeIn target="title" /></Step></Player></Player>), /Player 不能嵌套/],
    ['Step 没有 Player', page(<Step><FadeIn target="title" /></Step>), /Step 必须属于/],
    ['动作没有 Step', page(<Player><FadeIn target="title" /></Player>), /必须属于 Step/],
    [
      '动作位于已结束的 Step 之后',
      page(
        <Player>
          <Step><FadeIn target="title" /></Step>
          <FadeOut target="title" />
        </Player>,
      ),
      /必须属于 Step/,
    ],
    [
      'Step 位于已结束的 Player 之后',
      page(
        <>
          <Player><Step><FadeIn target="title" /></Step></Player>
          <Step><FadeOut target="title" /></Step>
        </>,
      ),
      /Step 必须属于 Player/,
    ],
    [
      '动作位于已结束的 Player 之后',
      page(
        <>
          <Player><Step><FadeIn target="title" /></Step></Player>
          <FadeOut target="title" />
        </>,
      ),
      /必须属于 Step/,
    ],
    [
      'Player 位于已结束的 Section 之后',
      <Slide>
        <Section><div id="title" /></Section>
        <Player><Step><FadeIn target="title" /></Step></Player>
      </Slide>,
      /Player 必须属于一个 Section/,
    ],
    ['嵌套 Step', page(<Player><Step><Step><FadeIn target="title" /></Step></Step></Player>), /Step 不能嵌套/],
    ['空 Player', page(<Player>{null}</Player>), /至少需要一个 Step/],
    ['Slide 空页面列表', <Slide>{null}</Slide>, /至少一个 Section/],
  ];
  for (const [name, tree, message] of invalidTrees) {
    it(name, () => {
      expect(() => collect(tree)).throw(message);
    });
  }
});
