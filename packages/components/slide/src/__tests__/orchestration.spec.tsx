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
  Animate,
  FadeIn,
  MoveIn,
  Parallel,
  Player,
  Pulse,
  Sequence,
  Step,
  Wait,
  type GroupProps,
  type Position,
  type StepConfig,
} from '../animation';
import { SlideStoreContext } from '../slide/collect/context';
import { ScopeEnd } from '../slide/collect/end';
import { slideConfigs } from '../slide/collect/plugin';
import { Section } from '../slide/section';
import { Slide } from '../slide/slide';
import { collect, page, renderContext } from './fixtures';

/** 比较作者可观察的时间，不依赖内部树的形状。 */
function timing(step: StepConfig) {
  return {
    duration: step.duration,
    actions: step.actions.map(({ target, start, transition }) => (
      [target, start, transition.duration]
    )),
  };
}

function step(children: ReactNode): StepConfig {
  return collect(page(<Player><Step>{children}</Step></Player>)).config.sections[0].steps[0];
}

describe('Step 内的时间编排', () => {
  it('Step 的直接子项默认并行，以最晚的结束时间作为时长', () => {
    const result = step(
      <>
        <FadeIn target="a" transition={{ duration: 600 }} />
        <Sequence>
          <FadeIn target="b" transition={{ duration: 100 }} />
          <FadeIn target="c" transition={{ duration: 200 }} />
        </Sequence>
        <Parallel>
          <FadeIn target="d" transition={{ duration: 400 }} />
          <FadeIn target="e" transition={{ duration: 50 }} />
        </Parallel>
      </>,
    );
    expect(timing(result)).deep.eq({
      duration: 600,
      actions: [
        ['a', 0, 600],
        ['b', 0, 100],
        ['c', 100, 200],
        ['d', 0, 400],
        ['e', 0, 50],
      ],
    });
  });

  it('Sequence 等待整个 Parallel 结束，也保留头尾的 Wait', () => {
    const result = step(
      <Sequence>
        <Wait duration={200} />
        <FadeIn target="a" transition={{ duration: 400 }} />
        <Parallel>
          <FadeIn target="b" transition={{ duration: 200 }} />
          <FadeIn target="c" transition={{ duration: 500 }} />
        </Parallel>
        <FadeIn target="d" transition={{ duration: 50 }} />
        <Wait duration={100} />
      </Sequence>,
    );
    expect(timing(result)).deep.eq({
      duration: 1250,
      actions: [
        ['a', 200, 400],
        ['b', 600, 200],
        ['c', 600, 500],
        ['d', 1100, 50],
      ],
    });
  });

  it('B 在 A 结束前 150ms 开始，后续动作沿 B 的 Sequence 接续', () => {
    const result = step(
      <>
        <Sequence id="a"><FadeIn target="a" transition={{ duration: 800 }} /></Sequence>
        <Sequence at={{ ref: 'a', edge: 'end', offset: -150 }}>
          <FadeIn target="b" transition={{ duration: 300 }} />
          <MoveIn target="caption" transition={{ duration: 400 }} />
          <Pulse target="conclusion" transition={{ duration: 200 }} />
        </Sequence>
      </>,
    );
    expect(timing(result)).deep.eq({
      duration: 1550,
      actions: [
        ['a', 0, 800],
        ['b', 650, 300],
        ['caption', 950, 400],
        ['conclusion', 1350, 200],
      ],
    });
  });

  it('at 延后整个分组；没有 at 的兄弟仍从父容器的 0 开始', () => {
    const result = step(
      <>
        <Sequence at={200}>
          <FadeIn target="a" transition={{ duration: 300 }} />
          <FadeIn target="b" transition={{ duration: 400 }} />
        </Sequence>
        <Sequence><FadeIn target="c" transition={{ duration: 100 }} /></Sequence>
        <FadeIn target="d" transition={{ duration: 50 }} />
      </>,
    );
    expect(timing(result)).deep.eq({
      duration: 900,
      actions: [
        ['a', 200, 300],
        ['b', 500, 400],
        ['c', 0, 100],
        ['d', 0, 50],
      ],
    });
  });

  it('允许依次引用带 at 的兄弟；end 取整个分组最晚的结束时间', () => {
    const result = step(
      <>
        <Parallel id="a" at={200}>
          <FadeIn target="long" transition={{ duration: 500 }} />
          <FadeIn target="short" transition={{ duration: 100 }} />
        </Parallel>
        <Sequence id="b" at={{ ref: 'a', edge: 'end', offset: -100 }}>
          <FadeIn target="b" transition={{ duration: 200 }} />
          <Wait duration={50} />
        </Sequence>
        <Parallel at={{ ref: 'b', edge: 'end' }}>
          <FadeIn target="c" transition={{ duration: 50 }} />
        </Parallel>
        <Sequence at={{ ref: 'b', edge: 'start', offset: 25 }}>
          <FadeIn target="d" transition={{ duration: 25 }} />
        </Sequence>
      </>,
    );
    expect(timing(result)).deep.eq({
      duration: 900,
      actions: [
        ['long', 200, 500],
        ['short', 200, 100],
        ['b', 600, 200],
        ['c', 850, 50],
        ['d', 625, 25],
      ],
    });
  });

  it('嵌套 at 相对直接父容器，外层 Sequence 接在完整的 Parallel 后', () => {
    const result = step(
      <Sequence at={200}>
        <Wait duration={50} />
        <Parallel>
          <Sequence id="a" at={100}>
            <FadeIn target="a" transition={{ duration: 200 }} />
            <FadeIn target="b" transition={{ duration: 50 }} />
          </Sequence>
          <Sequence at={{ ref: 'a', edge: 'end', offset: -50 }}>
            <FadeIn target="c" transition={{ duration: 400 }} />
          </Sequence>
          <FadeIn target="d" transition={{ duration: 100 }} />
        </Parallel>
        <FadeIn target="e" transition={{ duration: 300 }} />
      </Sequence>,
    );
    expect(timing(result)).deep.eq({
      duration: 1250,
      actions: [
        ['a', 350, 200],
        ['b', 550, 50],
        ['c', 550, 400],
        ['d', 250, 100],
        ['e', 950, 300],
      ],
    });
  });

  it('引用 start 是分组起点；end 包含动作 delay、开头和末尾 Wait', () => {
    const result = step(
      <>
        <Sequence id="anchor" at={200}>
          <Wait duration={50} />
          <FadeIn target="a" transition={{ duration: 100, delay: 30 }} />
          <Wait duration={20} />
        </Sequence>
        <Sequence at={{ ref: 'anchor', edge: 'start' }}>
          <FadeIn target="start" transition={{ duration: 10 }} />
        </Sequence>
        <Sequence at={{ ref: 'anchor', edge: 'end' }}>
          <FadeIn target="end" transition={{ duration: 10 }} />
        </Sequence>
      </>,
    );
    expect(timing(result)).deep.eq({
      duration: 410,
      actions: [['a', 280, 100], ['start', 200, 10], ['end', 400, 10]],
    });
  });

  it('负 offset 可以恰好回到父容器的 0；0 时长动作仍然保留', () => {
    expect(timing(step(
      <>
        <Parallel id="anchor" at={200}><Wait duration={0} /></Parallel>
        <Sequence at={{ ref: 'anchor', edge: 'start', offset: -200 }}>
          <FadeIn target="instant" transition={{ duration: 0, delay: 0 }} />
          <Wait duration={0} />
          <FadeIn target="next" transition={{ duration: 0 }} />
        </Sequence>
      </>,
    ))).deep.eq({ duration: 200, actions: [['instant', 0, 0], ['next', 0, 0]] });
  });

  it('接受小数毫秒，不把时间舍入为整数', () => {
    expect(timing(step(
      <Sequence at={0.5}>
        <Wait duration={0.25} />
        <FadeIn target="a" transition={{ duration: 1.25, delay: 0.5 }} />
      </Sequence>,
    ))).deep.eq({ duration: 2.5, actions: [['a', 1.25, 1.25]] });
  });

  it('Parallel 中的 Wait 只延长总时长，不推迟其他子项', () => {
    expect(timing(step(
      <Parallel>
        <Wait duration={500} />
        <FadeIn target="a" transition={{ duration: 100 }} />
      </Parallel>,
    ))).deep.eq({ duration: 500, actions: [['a', 0, 100]] });
  });

  it('空分组和纯等待分组也有区间，可被引用并延长 Step', () => {
    expect(timing(step(
      <>
        <Sequence id="empty" at={200} />
        <Parallel id="wait" at={{ ref: 'empty', edge: 'end' }}>
          <Wait duration={300} />
        </Parallel>
        <Sequence at={{ ref: 'wait', edge: 'end', offset: 100 }} />
      </>,
    ))).deep.eq({ duration: 600, actions: [] });
    expect(timing(step(
      <Sequence>
        <Parallel />
        <Sequence />
        <Wait duration={0} />
      </Sequence>,
    )))
      .deep.eq({ duration: 0, actions: [] });
  });

  it('空 Step 是独立触发位置，各 Step 的时间都从 0 计算', () => {
    const { config } = collect(page(
      <Player>
        <Step />
        <Step><Sequence at={200}><FadeIn target="a" transition={{ duration: 500 }} /></Sequence></Step>
        <Step />
        <Step><Wait duration={100} /></Step>
        <Step><FadeIn target="b" transition={{ duration: 300 }} /></Step>
      </Player>,
    ));
    expect(config.sections[0].steps.map(timing)).deep.eq([
      { duration: 0, actions: [] },
      { duration: 700, actions: [['a', 200, 500]] },
      { duration: 0, actions: [] },
      { duration: 100, actions: [] },
      { duration: 300, actions: [['b', 0, 300]] },
    ]);
  });
});

describe('分组默认值与 SSR 收集', () => {
  it('逐字段继承最近默认值，分组结束后恢复父级，delay 只计入 start 一次', () => {
    const { config } = collect(page(
      <Player transition={{ duration: 900, delay: 10, easing: 'linear' }}>
        <Step transition={{ duration: 500 }}>
          <Sequence transition={{ duration: 400, delay: 20 }}>
            <FadeIn target="a" />
            <Parallel transition={{ duration: 100, easing: 'ease-in' }}>
              <FadeIn target="b" transition={{ duration: 0, delay: 0 }} />
              <FadeIn target="c" />
            </Parallel>
            <FadeIn target="d" transition={{ duration: undefined }} />
          </Sequence>
          <FadeIn target="e" />
        </Step>
        <Step><FadeIn target="f" /></Step>
      </Player>,
    ));
    expect(config.sections[0].steps.map(timing)).deep.eq([
      {
        duration: 960, actions: [
          ['a', 20, 400],
          ['b', 420, 0],
          ['c', 440, 100],
          ['d', 560, 400],
          ['e', 10, 500],
        ],
      },
      { duration: 910, actions: [['f', 10, 900]] },
    ]);
    expect(config.sections[0].steps[0].actions.map(({ transition }) => transition.easing))
      .deep.eq([
        'linear',
        'ease-in',
        'ease-in',
        'linear',
        'linear',
      ]);
    for (const { actions } of config.sections[0].steps) {
      expect(actions.every(({ transition }) => !Object.hasOwn(transition, 'delay'))).eq(true);
    }
  });

  it('Wait 只使用自己的 duration，不继承动作的 duration 或 delay', () => {
    const { config } = collect(page(
      <Player transition={{ duration: 900, delay: 50 }}>
        <Step>
          <Sequence>
            <Wait duration={100} />
            <FadeIn target="a" />
          </Sequence>
        </Step>
      </Player>,
    ));
    expect(timing(config.sections[0].steps[0])).deep.eq({ duration: 1050, actions: [['a', 150, 900]] });
  });

  it('Hook 封装、Provider、Fragment、条件和循环不形成编排作用域，也不输出 DOM', () => {
    const Targets = createContext(['a', 'b']);
    function Items() {
      return (
        <>
          {useContext(Targets).map((target) => (
            <FadeIn key={target} target={target} transition={{ duration: 100 }} />
          ))}
        </>
      );
    }
    function Chain(props: GroupProps) {
      return <Sequence {...props}><Items /></Sequence>;
    }
    const { config, html } = collect(page(
      <Player>
        <Step>
          <Targets.Provider value={['one', 'two']}>
            {false && <Sequence id="a" />}
            <Chain id="a" at={200} />
            <Chain at={{ ref: 'a', edge: 'end' }} />
          </Targets.Provider>
        </Step>
      </Player>,
    ));
    expect(timing(config.sections[0].steps[0])).deep.eq({
      duration: 600,
      actions: [
        ['one', 200, 100],
        ['two', 300, 100],
        ['one', 400, 100],
        ['two', 500, 100],
      ],
    });
    expect(html).eq(renderToStaticMarkup(page(null)));
  });

  it('分组名可以在独立的父容器、Step 和 Section 内重复', () => {
    function Groups() {
      return (
        <>
          <Sequence id="same"><Wait duration={100} /></Sequence>
          <Parallel at={{ ref: 'same', edge: 'end' }}><FadeIn target="a" transition={{ duration: 50 }} /></Parallel>
        </>
      );
    }
    const { config } = collect(
      <Slide>
        {[1, 2].map((index) => (
          <Section key={index}>
            <Player>
              <Step>
                <Parallel id="same"><Groups /></Parallel>
                <Parallel><Groups /></Parallel>
              </Step>
              <Step><Groups /></Step>
            </Player>
          </Section>
        ))}
      </Slide>,
    );
    expect(config.sections.map(({ steps }) => steps.map(timing))).deep.eq([1, 2].map(() => [
      { duration: 150, actions: [['a', 100, 50], ['a', 100, 50]] },
      { duration: 150, actions: [['a', 100, 50]] },
    ]));
  });

  it('普通字符串分组名不会与对象原型属性冲突', () => {
    expect(timing(step(
      <>
        <Sequence id="__proto__" at={100}><Wait duration={50} /></Sequence>
        <Parallel id="constructor" at={{ ref: '__proto__', edge: 'end' }}><Wait duration={20} /></Parallel>
        <Sequence at={{ ref: 'constructor', edge: 'end' }}><FadeIn target="a" transition={{ duration: 10 }} /></Sequence>
      </>,
    ))).deep.eq({ duration: 180, actions: [['a', 170, 10]] });
  });

  it('登记时复制 at 和分组默认值，后续组件修改输入也不影响已登记节点', () => {
    const at = { ref: 'anchor', edge: 'end', offset: -50 } satisfies Position;
    const transition = { duration: 100, delay: 20 };
    function Mutate() {
      at.offset = 999;
      at.ref = 'missing';
      transition.duration = 900;
      transition.delay = 900;
      return null;
    }
    const result = step(
      <>
        <Parallel id="anchor"><Wait duration={200} /></Parallel>
        <Sequence at={at} transition={transition}><FadeIn target="a" /></Sequence>
        <Mutate />
      </>,
    );
    expect(timing(result)).deep.eq({ duration: 270, actions: [['a', 170, 100]] });
  });

  it('冻结的定位对象可复用，每轮收集重新计算，不保存跨渲染的起止状态', () => {
    const at = Object.freeze({ ref: 'anchor', edge: 'end' as const, offset: 10 });
    const tree = page(
      <Player>
        <Step>
          <Sequence id="anchor"><Wait duration={200} /></Sequence>
          <Sequence at={at}><FadeIn target="a" transition={{ duration: 100 }} /></Sequence>
        </Step>
      </Player>,
    );
    const first = collect(tree).config;
    expect(collect(tree).config).deep.eq(first);
    expect(timing(first.sections[0].steps[0])).deep.eq({ duration: 310, actions: [['a', 210, 100]] });
  });

  it('组件内部重渲染时，分组入口和等待节点都只登记一次', () => {
    let registrations = 0;
    function Retry() {
      const store = useContext(SlideStoreContext)!;
      const [ready, setReady] = useState(false);
      useRenderOnce(() => {
        registrations++;
        store.beginGroup('sequence', { at: 200 });
        store.addWait({ duration: 100 });
      });

      if (!ready) {
        setReady(true);
      }

      return (
        <>
          <FadeIn target="a" transition={{ duration: 50 }} />
          <ScopeEnd scope="sequence" />
        </>
      );
    }
    expect(timing(step(<Retry />))).deep.eq({ duration: 350, actions: [['a', 300, 50]] });
    expect(registrations).eq(1);
  });

  it('解析失败不发布半成品，修正同一页面后可以重新收集', () => {
    const context = renderContext();
    expect(() => collect(page(
      <Player>
        <Step>
          <FadeIn target="a" />
          <Sequence at={{ ref: 'missing', edge: 'end' }} />
        </Step>
      </Player>,
    ), context)).throw(/引用.*无效/);
    expect(slideConfigs.has(context.page)).eq(false);
    const { config } = collect(page(
      <Player><Step><Sequence at={200}><Wait duration={100} /></Sequence></Step></Player>,
    ), context);
    expect(timing(config.sections[0].steps[0])).deep.eq({ duration: 300, actions: [] });
  });
});

describe('编排作用域和引用校验', () => {
  const cases: [string, ReactNode, RegExp][] = [
    [
      '前向引用',
      <>
        <Sequence at={{ ref: 'later', edge: 'end' }} />
        <Parallel id="later" />
      </>,
      /先声明的分组/,
    ],
    ['引用自身', <Sequence id="self" at={{ ref: 'self', edge: 'end' }} />, /先声明的分组/],
    [
      '循环引用',
      <>
        <Sequence id="a" at={{ ref: 'b', edge: 'end' }} />
        <Sequence id="b" at={{ ref: 'a', edge: 'end' }} />
      </>,
      /先声明的分组/,
    ],
    ['引用不存在的分组', <Sequence at={{ ref: 'missing', edge: 'end' }} />, /先声明的分组/],
    [
      '动作 target 不是分组 id',
      <>
        <FadeIn target="a" />
        <Sequence at={{ ref: 'a', edge: 'end' }} />
      </>,
      /先声明的分组/,
    ],
    ['不能引用父容器', <Parallel id="parent"><Sequence at={{ ref: 'parent', edge: 'start' }} /></Parallel>, /先声明的分组/],
    [
      '不能引用外层兄弟',
      <>
        <Sequence id="outer" />
        <Parallel><Sequence at={{ ref: 'outer', edge: 'end' }} /></Parallel>
      </>,
      /先声明的分组/,
    ],
    [
      '不能引用后代',
      <>
        <Parallel><Sequence id="inner" /></Parallel>
        <Sequence at={{ ref: 'inner', edge: 'end' }} />
      </>,
      /先声明的分组/,
    ],
    [
      'Step 内分组名重复',
      <>
        <Sequence id="same" />
        <Parallel id="same" />
      </>,
      /id 重复/,
    ],
    [
      'Sequence 内分组名重复',
      <Sequence>
        <Sequence id="same" />
        <Parallel id="same" />
      </Sequence>,
      /id 重复/,
    ],
    [
      'Parallel 内分组名重复',
      <Parallel>
        <Sequence id="same" />
        <Parallel id="same" />
      </Parallel>,
      /id 重复/,
    ],
    ['Sequence 子项不能设置数字 at，包含 0', <Sequence><Parallel at={0} /></Sequence>, /Sequence 的直接子项必须依次执行/],
    [
      'Sequence 子项不能设置引用 at',
      <Sequence>
        <Parallel id="a" />
        <Sequence at={{ ref: 'a', edge: 'end' }} />
      </Sequence>,
      /Sequence 的直接子项必须依次执行/,
    ],
    [
      '引用得到负的开始时间',
      <>
        <Sequence id="a"><Wait duration={100} /></Sequence>
        <Sequence at={{ ref: 'a', edge: 'end', offset: -101 }} />
      </>,
      /at 解析结果.*非负/,
    ],
    [
      '不能用外层起点掩盖负的局部时间',
      <Parallel at={1000}>
        <Sequence id="a" />
        <Sequence at={{ ref: 'a', edge: 'start', offset: -1 }} />
      </Parallel>,
      /at 解析结果.*非负/,
    ],
    ['Sequence 不能包含 Step', <Sequence><Step /></Sequence>, /Step 必须属于 Player/],
    ['Parallel 不能包含 Step', <Parallel><Step /></Parallel>, /Step 必须属于 Player/],
  ];

  for (const [name, children, message] of cases) {
    it(name, () => {
      expect(() => step(children)).throw(message);
    });
  }

  it('引用不能跨 Step', () => {
    expect(() => collect(page(
      <Player>
        <Step><Sequence id="a" /></Step>
        <Step><Sequence at={{ ref: 'a', edge: 'end' }} /></Step>
      </Player>,
    ))).throw(/先声明的分组/);
  });

  const outside = [
    ['Sequence', <Sequence />],
    ['Parallel', <Parallel />],
    ['Wait', <Wait duration={100} />],
  ] as const;

  for (const [name, component] of outside) {
    it(`${name} 在 Step 外无效，结束过的 Step 也不能接收它`, () => {
      expect(() => collect(page(<Player>{component}</Player>))).throw(/必须属于 Step/);
      expect(() => collect(page(
        <Player>
          <Step />
          {component}
        </Player>,
      ))).throw(/必须属于 Step/);
      expect(() => collect(page(component))).throw(/必须属于 Step/);
    });
  }

  it('定位错误包含页码、Step 和分组名', () => {
    expect(() => collect(
      <Slide>
        <Section>静态页</Section>
        <Section>
          <Player>
            <Step />
            <Step><Sequence id="caption" at={{ ref: 'missing', edge: 'end' }} /></Step>
          </Player>
        </Section>
      </Slide>,
    )).throw(/第 2 页 Step 2.*Sequence "caption".*missing/);
  });
});

describe('JS / MDX 输入和时间边界校验', () => {
  const invalidTimes = [
    -1,
    NaN,
    Infinity,
    -Infinity,
    '100',
    null,
  ];

  for (const value of invalidTimes) {
    it(`动作时长拒绝 ${String(value)}`, () => {
      expect(() => step(<Animate target="a" to={{ opacity: 1 }} transition={{ duration: value as any }} />))
        .throw(/transition\.duration.*有限的非负/);
    });
  }

  const invalidDelay = { delay: -1 };
  const levels: [string, ReactNode][] = [
    ['Player', <Player transition={invalidDelay}><Step /></Player>],
    ['Step', <Player><Step transition={invalidDelay} /></Player>],
    ['Sequence', <Player><Step><Sequence transition={invalidDelay} /></Step></Player>],
    ['Parallel', <Player><Step><Parallel transition={invalidDelay} /></Step></Player>],
    ['Animate', <Player><Step><Animate target="a" to={{ opacity: 1 }} transition={invalidDelay} /></Step></Player>],
  ];
  for (const [name, child] of levels) {
    it(`${name} 接入时间校验，拒绝负数 delay`, () => {
      expect(() => collect(page(child))).throw(/transition\.delay.*有限的非负/);
    });
  }

  it('Wait 校验自身时长', () => {
    expect(() => step(<Wait duration={-1} />)).throw(/Wait.duration.*有限的非负/);
  });

  const invalidPositions: unknown[] = [
    -1,
    null,
    { ref: ' ', edge: 'end' },
    { ref: 'a', edge: 'finish' },
    { ref: 'a', edge: 'end', offset: Infinity },
    { ref: 'a', edge: 'end', offset: '100' },
  ];

  for (const [index, at] of invalidPositions.entries()) {
    it(`拒绝无效 at 输入 ${index + 1}：${String(at)}`, () => {
      expect(() => step(
        <>
          <Sequence id="a" />
          <Parallel at={at as Position} />
        </>,
      )).throw(/at 必须/);
    });
  }

  for (const id of [' ', 123]) {
    it(`拒绝无效分组 id：${String(id)}`, () => {
      expect(() => step(<Sequence id={id as any} />)).throw(/id 必须是非空字符串/);
    });
  }

  const position = { at: 0 } as any;
  const misplaced: [string, ReactNode][] = [
    ['Animate', <Animate target="a" to={{ opacity: 1 }} {...position} />],
    ['FadeIn', <FadeIn target="a" {...position} />],
    ['Wait', <Wait duration={100} {...position} />],
    ['Step', <Step {...position} />],
    ['Player', <Player {...position}><Step /></Player>],
  ];

  for (const [name, child] of misplaced) {
    it(`${name} 不接受 at，即使通过 JS 传入也报错`, () => {
      expect(() => step(child)).throw(/at 只能用于/);
    });
  }

  const max = Number.MAX_VALUE;
  const overflows: [string, ReactNode][] = [
    ['delay 加 duration', <FadeIn target="a" transition={{ duration: max, delay: max }} />],
    [
      'Sequence 累计时长',
      <Sequence>
        <Wait duration={max} />
        <Wait duration={max} />
      </Sequence>,
    ],
    ['at 加分组时长', <Sequence at={max}><Wait duration={max} /></Sequence>],
    ['嵌套的绝对起点', <Parallel at={max}><Sequence at={max} /></Parallel>],
    ['局部时长有限但绝对结束溢出', <Parallel at={max}><Sequence><Wait duration={max} /></Sequence></Parallel>],
    [
      '引用加 offset',
      <>
        <Parallel id="a" at={max} />
        <Sequence at={{ ref: 'a', edge: 'end', offset: max }} />
      </>,
    ],
  ];

  for (const [name, child] of overflows) {
    it(`${name} 溢出时拒绝配置，避免 Infinity 变成 JSON null`, () => {
      expect(() => step(child)).throw(/有限的非负/);
    });
  }
});
