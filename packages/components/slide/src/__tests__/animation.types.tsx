import React from 'react';
import {
  Animate,
  FadeIn,
  MoveIn,
  Parallel,
  Player,
  Sequence,
  Step,
  Wait,
  type ActionConfig,
  type Position,
  type StepConfig,
} from '../animation';

// 此文件由 tsc 检查，不进入 Mocha。防止公开类型意外放宽或丢失字段。
const position: Position = { ref: 'a', edge: 'end', offset: -150 };
const action: ActionConfig = {
  target: 'a',
  start: 200,
  keyframes: [{ opacity: 1 }],
  transition: { duration: 300, easing: 'linear' },
};
const step: StepConfig = { duration: 500, actions: [action] };
void step;

void [
  <Player>
    <Step />
    <Step><FadeIn target="a" /></Step>
  </Player>,
  <Sequence id="a" at={200} transition={{ duration: 100, delay: 20 }}><Wait duration={50} /></Sequence>,
  <Parallel at={position}>
    <FadeIn target="a" />
    <MoveIn target="b" />
  </Parallel>,
  <Animate target="a" keyframes={[{ opacity: 0 }, { opacity: 1 }]} />,
  <Animate target="a" to={{ opacity: 1 }} />,
  // @ts-expect-error Step 的触发由位置决定，没有 trigger 属性。
  <Step trigger="enter" />,
  // @ts-expect-error Step 不参与时间定位。
  <Step at={200} />,
  // @ts-expect-error Player 管理触发步骤，不参与时间定位。
  <Player at={200}><Step /></Player>,
  // @ts-expect-error Animate 只描述效果，at 属于分组。
  <Animate target="a" to={{ opacity: 1 }} at={200} />,
  // @ts-expect-error 效果组件同样不接受 at。
  <FadeIn target="a" at={200} />,
  // @ts-expect-error 带额外参数的效果也不接受 at。
  <MoveIn target="a" direction="left" at={200} />,
  // @ts-expect-error Wait 只占用时间，不接受 at。
  <Wait duration={100} at={200} />,
  // @ts-expect-error Wait 的等待时长必须显式提供。
  <Wait />,
  // @ts-expect-error Wait 不包含子元素。
  <Wait duration={100}><FadeIn target="a" /></Wait>,
  // @ts-expect-error 引用必须明确选择起点还是终点。
  <Sequence at={{ ref: 'a' }} />,
  // @ts-expect-error 时间单位统一为毫秒数字。
  <Sequence at="200ms" />,
  // @ts-expect-error 不引入相对字符串语法。
  <Parallel at="-=150" />,
  // @ts-expect-error 编排分组名与 DOM target 分开。
  <Sequence target="a" />,
  // @ts-expect-error 起终点与关键帧不能同时出现。
  <Animate target="a" to={{ opacity: 1 }} keyframes={[{ opacity: 0 }]} />,
];

// @ts-expect-error 编译后的动作必须有相对 Step 的开始时间。
const missingStart: ActionConfig = { target: 'a', keyframes: [], transition: action.transition };
// @ts-expect-error 总时长不能从动作反推，可能还有末尾 Wait。
const missingDuration: StepConfig = { actions: [] };
// @ts-expect-error delay 已并入 start，输出不再保留第二份延迟。
const duplicateDelay: ActionConfig['transition'] = { duration: 100, delay: 20, easing: 'linear' };
void [missingStart, missingDuration, duplicateDelay];
