import { describe, expect, it } from '@blog/test-toolkit';
import { RenderContext } from '@blog/context/runtime';
import type { IRenderContext } from '@blog/types';
import React, { createContext, useContext, type ReactNode } from 'react';
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
import type { Transition } from '../animation/types';
import { collectSlide } from '../slide/collect';
import { SlideContext, type SlideContextValue } from '../slide/collect/context';
import { Section } from '../slide/section';
import { Slide } from '../slide/slide';

function renderContext(): IRenderContext {
  // 收集入口只使用页面身份与阶段标记，测试无需搭建资源和站点模型。
  return {
    page: {} as IRenderContext['page'],
    site: {} as IRenderContext['site'],
    dev: false,
    isPreBuild: true,
  };
}

function renderPage(children: ReactNode, context: IRenderContext): string {
  return renderToStaticMarkup(<RenderContext.Provider value={context}>{children}</RenderContext.Provider>);
}

function collect(children: ReactNode, context = renderContext()) {
  return collectSlide(context.page, () => renderPage(children, context));
}

function page(animation: ReactNode, content: ReactNode = <div id="title">标题</div>) {
  return (
    <Slide>
      <Section>
        {content}
        {animation}
      </Section>
    </Slide>
  );
}

describe('transition 字段继承', () => {
  it('动作优先于 Step，Step 优先于 Player；undefined 继承而 0 覆盖', () => {
    const player = { duration: 800, delay: 100, easing: 'linear' };
    const step = { duration: 500, delay: undefined };
    const action = { duration: 0, delay: 0, easing: undefined };
    expect(mergeTransition(player, step, action)).deep.eq({ duration: 0, delay: 0, easing: 'linear' });
    expect(player).deep.eq({ duration: 800, delay: 100, easing: 'linear' });
    expect(mergeTransition()).deep.eq({ duration: 300, delay: 0, easing: 'ease-out' });
  });

  for (const transition of [
    { duration: -1 },
    { delay: Infinity },
    { duration: NaN },
    { easing: '' },
  ]) {
    it(`拒绝非法 transition：${JSON.stringify(transition)}`, () => {
      expect(() => mergeTransition(transition)).throw(/transition/);
    });
  }

  it('即使后续值覆盖，较低层的非法配置仍然报错', () => {
    expect(() => mergeTransition({ delay: -1 }, { delay: 0 })).throw(/delay/);
    expect(() => mergeTransition({ duration: 300, unknown: 1 } as Transition)).throw(/不支持字段/);
  });
});

describe('SSR 动画收集', () => {
  it('固定画布、无 id 的页及没有动画的页都可收集，顺序与页码一致', () => {
    const { html, config } = collect(
      <Slide>
        <Section title="开场"><h1>开场</h1></Section>
        <Section>第二页</Section>
      </Slide>,
    );
    expect(config).deep.eq({
      version: 1,
      width: 2560,
      height: 1440,
      sections: [{ title: '开场', steps: [] }, { steps: [] }],
    });
    expect(html).include('data-slide-section="0"').include('data-slide-section="1"');
    expect(html).include('data-slide-width="2560"').include('data-slide-height="1440"');
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
      from: { opacity: 0 },
      to: { opacity: 1 },
      before: { visibility: 'visible' },
      transition: { duration: 500, delay: 0, easing: 'linear' },
    });
    expect(exit).deep.eq({
      target: 'title',
      to: { opacity: 0 },
      after: { visibility: 'hidden' },
      transition: { duration: 0, delay: 0, easing: 'linear' },
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
    expect(move.from).deep.eq({ transform: 'translate3d(0px, 0px, 0)' });
    expect(move.to).deep.eq({ transform: 'translate3d(0, 0, 0)' });
    expect(scale.before).deep.eq({ visibility: 'visible', transformOrigin: 'left top' });
    expect(scale.from).deep.eq({ transform: 'scale(0)' });
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
    expect(first.sections[0].steps[0].actions[0].to.opacity).eq(1);
    expect(second.sections).deep.eq([{ steps: [] }]);
    expect(first.width).eq(2560);
  });

  it('正式渲染不展开动画子树、不再次收集，也不输出资源标签', () => {
    function MustNotRender(): never {
      throw new Error('正式渲染不应执行动画子树');
    }
    const html = renderToStaticMarkup(page(<Player><MustNotRender /></Player>));
    expect(html).include('标题').not.include('<script');
  });

  it('Slide 提供登记函数，同一元素的两轮 SSR 使用独立配置和栈', () => {
    const contexts: SlideContextValue[] = [];
    function Probe() {
      const context = useContext(SlideContext);

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

  it('预渲染入口只调用渲染一次，失败后不影响下一份 PPT', () => {
    let renders = 0;
    const context = renderContext();
    const content = page(<Player><Step><FadeIn target="title" /></Step></Player>);
    const { config } = collectSlide(context.page, () => {
      renders++;
      return renderPage(content, context);
    });
    expect(renders).eq(1);
    expect(config.sections[0].steps).length(1);
    expect(() => collect(<Slide>{null}</Slide>)).throw(/至少一个 Section/);
    expect(collect(<Slide><Section>一页</Section></Slide>).config.sections).deep.eq([{ steps: [] }]);
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
    expect(config.sections.map(({ steps }) => steps.map(({ actions }) => actions[0].transition.duration)))
      .deep.eq([[500, 800], [300]]);
    expect(html).not.include('ScopeEnd').not.include('<script');
  });

  it('同一页面在渲染异常或配置错误后，可以重新收集', () => {
    const context = renderContext();
    expect(() => collectSlide(context.page, () => {
      throw new Error('渲染失败');
    })).throw(/渲染失败/);
    expect(() => collect(page(<Player>{null}</Player>), context)).throw(/至少需要一个 Step/);
    expect(collect(page(<Player><Step><FadeIn target="title" /></Step></Player>), context)
      .config.sections[0].steps).length(1);
  });

  it('不同页面的收集入口可以嵌套，同一页面不能重入', () => {
    const context = renderContext();
    const content = <Slide><Section>外页</Section></Slide>;
    const { config } = collectSlide(context.page, () => {
      expect(collect(<Slide><Section title="内页">内页</Section></Slide>).config.sections)
        .deep.eq([{ title: '内页', steps: [] }]);
      expect(() => collectSlide(context.page, () => renderPage(content, context)))
        .throw(/同一页面不能同时/);
      return renderPage(content, context);
    });
    expect(config.width).eq(2560);
    expect(config.sections).deep.eq([{ steps: [] }]);
  });

  it('入口必须同步返回 HTML，且使用本页的预渲染 RenderContext', () => {
    const context = renderContext();
    const content = <Slide><Section>一页</Section></Slide>;
    expect(() => collectSlide(context.page, (() => Promise.resolve('')) as unknown as () => string))
      .throw(/同步返回完整 HTML/);
    expect(() => collectSlide(context.page, () => renderToStaticMarkup(content)))
      .throw(/预渲染 RenderContext/);
    expect(() => collectSlide(context.page, () => renderPage(content, renderContext())))
      .throw(/预渲染必须通过 collectSlide/);
    expect(() => renderPage(content, context)).throw(/预渲染必须通过 collectSlide/);
    expect(collect(content, context).config.sections).length(1);
  });

  it('栈内的范围必须按顺序结束，结束前不能取得最终配置', () => {
    function Probe() {
      const context = useContext(SlideContext)!;
      expect(() => context.end('player')).throw(/范围没有按顺序结束/);
      expect(() => context.getConfig()).throw(/范围尚未结束/);
      return <div id="title" />;
    }
    expect(collect(page(<Player><Step><FadeIn target="title" /></Step></Player>, <Probe />))
      .config.sections[0].steps).length(1);
  });

  it('同一步按上报顺序保存动作，不额外分析样式冲突', () => {
    const { config } = collect(page(<Player><Step><FadeIn target="title" /><FadeOut target="title" /></Step></Player>));
    expect(config.sections[0].steps[0].actions.map(({ to }) => to.opacity)).deep.eq([1, 0]);
  });
});

describe('不符合规范时构建报错', () => {
  const invalidTrees: [string, ReactNode, RegExp][] = [
    ['缺失 Slide', <div>普通内容</div>, /必须包含一个 Slide/],
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
    ['Player 没有 Section', <Player><Step><FadeIn target="title" /></Step></Player>, /Player 必须属于/],
    ['Section 没有 Slide', <Section>一页</Section>, /Section 必须属于/],
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
      page(<Player><Step><FadeIn target="title" /></Step><FadeOut target="title" /></Player>),
      /必须属于 Step/,
    ],
    [
      'Step 位于已结束的 Player 之后',
      page(<><Player><Step><FadeIn target="title" /></Step></Player><Step><FadeOut target="title" /></Step></>),
      /Step 必须属于 Player/,
    ],
    [
      '动作位于已结束的 Player 之后',
      page(<><Player><Step><FadeIn target="title" /></Step></Player><FadeOut target="title" /></>),
      /必须属于 Step/,
    ],
    [
      'Player 位于已结束的 Section 之后',
      <Slide><Section><div id="title" /></Section><Player><Step><FadeIn target="title" /></Step></Player></Slide>,
      /Player 必须属于一个 Section/,
    ],
    ['嵌套 Step', page(<Player><Step><Step><FadeIn target="title" /></Step></Step></Player>), /Step 不能嵌套/],
    ['空 Player', page(<Player>{null}</Player>), /至少需要一个 Step/],
    ['空 Step', page(<Player><Step>{null}</Step></Player>), /没有动作/],
    ['空终点', page(<Player><Step><Animate target="title" to={{}} /></Step></Player>), /终点属性/],
    ['未声明的 Player 属性', page(<Player {...({ children: <Step><FadeIn target="title" /></Step>, duration: 100 } as React.ComponentProps<typeof Player>)} />), /Player 不支持属性 duration/],
    ['非法透明度', page(<Player><Step><Animate target="title" to={{ opacity: 2 }} /></Step></Player>), /opacity/],
    ['无效 target', page(<Player><Step><FadeIn target="" /></Step></Player>), /target/],
    ['Slide 空页面列表', <Slide>{null}</Slide>, /至少一个 Section/],
  ];
  for (const [name, tree, message] of invalidTrees) {
    it(name, () => {
      expect(() => collect(tree)).throw(message);
    });
  }
});
