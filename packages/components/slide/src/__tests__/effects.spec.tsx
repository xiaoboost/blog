import { describe, expect, it } from '@blog/test-toolkit';
import React, { type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  Player,
  Step,
  FadeIn,
  FadeOut,
  MoveIn,
  MoveOut,
  ScaleIn,
  ScaleOut,
  RotateIn,
  RotateOut,
  WipeIn,
  WipeOut,
  Pulse,
} from '../animation';
import type { ActionConfig, AnimationState } from '../animation/types';
import { collect, page } from './fixtures';

function action(effect: ReactNode): ActionConfig {
  const { html, config } = collect(page(
    <Player transition={{ duration: 750 }}>
      <Step transition={{ delay: 20 }}>{effect}</Step>
    </Player>,
  ));
  expect(html).eq(renderToStaticMarkup(page(null)));
  return config.sections[0].steps[0].actions[0];
}

describe('效果封装的公开约定', () => {
  type Preset = [
    string,
    ReactNode,
    AnimationState[],
    AnimationState | undefined,
    AnimationState | undefined,
  ];
  const presets: Preset[] = [
    [
      'FadeIn',
      <FadeIn target="title" />,
      [{ opacity: 0 }, { opacity: 1 }],
      { visibility: 'visible' },
      undefined,
    ],
    [
      'FadeOut',
      <FadeOut target="title" />,
      [{ opacity: 0 }],
      undefined,
      { visibility: 'hidden' },
    ],
    [
      'MoveIn',
      <MoveIn target="title" />,
      [{ translate: '0px 32px', opacity: 0 }, { translate: '0px 0px', opacity: 1 }],
      { visibility: 'visible' },
      undefined,
    ],
    [
      'MoveOut',
      <MoveOut target="title" />,
      [{ translate: '0px 32px', opacity: 0 }],
      undefined,
      { visibility: 'hidden' },
    ],
    [
      'ScaleIn',
      <ScaleIn target="title" />,
      [{ scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1 }],
      { visibility: 'visible', transformOrigin: 'center' },
      undefined,
    ],
    [
      'ScaleOut',
      <ScaleOut target="title" />,
      [{ scale: 0.9, opacity: 0 }],
      { transformOrigin: 'center' },
      { visibility: 'hidden' },
    ],
    [
      'RotateIn',
      <RotateIn target="title" />,
      [{ rotate: '-15deg', opacity: 0 }, { rotate: '0deg', opacity: 1 }],
      { visibility: 'visible', transformOrigin: 'center' },
      undefined,
    ],
    [
      'RotateOut',
      <RotateOut target="title" />,
      [{ rotate: '15deg', opacity: 0 }],
      { transformOrigin: 'center' },
      { visibility: 'hidden' },
    ],
    [
      'WipeIn',
      <WipeIn target="title" />,
      [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }],
      { visibility: 'visible' },
      undefined,
    ],
    [
      'WipeOut',
      <WipeOut target="title" />,
      [{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 100% 0 0)' }],
      undefined,
      { visibility: 'hidden' },
    ],
    [
      'Pulse',
      <Pulse target="title" />,
      [{ scale: 1 }, { scale: 1.05 }, { scale: 1 }],
      { transformOrigin: 'center' },
      undefined,
    ],
  ];

  for (const [
    name,
    effect,
    keyframes,
    before,
    after,
  ] of presets) {
    it(`${name} 产生可收集的状态并继承时间，不输出视觉 DOM`, () => {
      const result = action(effect);
      expect(result).deep.eq({
        target: 'title',
        keyframes,
        transition: { duration: 750, delay: 20, easing: 'ease-out' },
        ...(before === undefined ? {} : { before }),
        ...(after === undefined ? {} : { after }),
      });
    });
  }

  const directions = [
    ['left', '-12px 0px', 'inset(0 100% 0 0)'],
    ['right', '12px 0px', 'inset(0 0 0 100%)'],
    ['top', '0px -12px', 'inset(0 0 100% 0)'],
    ['bottom', '0px 12px', 'inset(100% 0 0 0)'],
  ] as const;

  for (const [direction, translate, clipPath] of directions) {
    it(`${direction} 方向用于进入和退出；关闭 fade 不修改透明度`, () => {
      const enter = action(
        <MoveIn
          target="title"
          direction={direction}
          distance={12}
          fade={false}
        />,
      );
      const exit = action(
        <MoveOut
          target="title"
          direction={direction}
          distance={12}
          fade={false}
        />,
      );
      expect(enter.keyframes).deep.eq([{ translate }, { translate: '0px 0px' }]);
      expect(exit.keyframes).deep.eq([{ translate }]);
      expect(exit.after).deep.eq({ visibility: 'hidden' });
      expect(action(<WipeIn target="title" direction={direction} />).keyframes[0]).deep.eq({ clipPath });
      expect(action(<WipeOut target="title" direction={direction} />).keyframes[1]).deep.eq({ clipPath });
    });
  }

  it('独立的 translate / scale / rotate 不覆盖作者的 transform，保留 0 参数', () => {
    const { html, config } = collect(page(
      <Player>
        <Step>
          <MoveIn target="title" distance={0} fade={false} />
          <ScaleOut
            target="title"
            scale={0}
            origin="left top"
            fade={false}
          />
          <RotateIn target="title" angle={0} fade={false} />
        </Step>
      </Player>, <div id="title" style={{ transform: 'skewX(12deg)' }}>内容</div>));
    const [move, scale, rotate] = config.sections[0].steps[0].actions;
    expect(move.keyframes[0]).deep.eq({ translate: '0px 0px' });
    expect(scale.keyframes).deep.eq([{ scale: 0 }]);
    expect(scale.before).deep.eq({ transformOrigin: 'left top' });
    expect(rotate.keyframes).deep.eq([{ rotate: '0deg' }, { rotate: '0deg' }]);
    expect(html).include('transform:skewX(12deg)').not.include('<script');
    for (const preset of [move, scale, rotate]) {
      expect(preset.keyframes.every((frame) => !Object.hasOwn(frame, 'transform'))).eq(true);
    }
  });

  it('Pulse 保持首尾状态并允许修改幅度、原点及动作时间', () => {
    const result = action(
      <Pulse
        target="title"
        scale={1.2}
        origin="right bottom"
        transition={{ duration: 0, delay: 0 }}
      />,
    );
    expect(result.keyframes).deep.eq([{ scale: 1 }, { scale: 1.2 }, { scale: 1 }]);
    expect(result.before).deep.eq({ transformOrigin: 'right bottom' });
    expect(result.transition).deep.eq({ duration: 0, delay: 0, easing: 'ease-out' });
  });
});
