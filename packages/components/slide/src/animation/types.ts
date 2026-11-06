import type { AnimationState, ResolvedTransition } from '@blog/types';
import type { ReactNode } from 'react';

export type {
  AnimationState,
  ResolvedTransition,
  ActionConfig,
  StepConfig,
} from '@blog/types';

export type Transition = Partial<ResolvedTransition>;

export interface PlayerProps {
  children: ReactNode;
  /** 为后代动作提供默认值，不控制 Step 之间的触发。 */
  transition?: Transition;
}

/** 一次触发边界：首个 Step 对应进场，后续 Step 对应点击或键盘前进。 */
export interface StepProps {
  /** 直接子项默认并行；空 Step 保留为一个停顿位置。 */
  children?: ReactNode;
  transition?: Transition;
}

/** 相对直接父容器的毫秒位置，或同一父容器内先声明的分组的起止位置。 */
export type Position = number | {
  ref: string;
  edge: 'start' | 'end';
  offset?: number;
};

export interface GroupProps {
  children?: ReactNode;
  /** 编排分组名，只在同一父容器内唯一，与 DOM id 无关。 */
  id?: string;
  /** 仅当直接编排父容器是 Step / Parallel 时可用；不能用于 Sequence 的子项。 */
  at?: Position;
  /** 为后代动作提供默认值，不是分组的总时长或分组整体的延迟。 */
  transition?: Transition;
}

export type SequenceProps = GroupProps;
export type ParallelProps = GroupProps;

export interface WaitProps {
  /** 只占用时间，不产生动作；单位毫秒。 */
  duration: number;
}

export interface AnimationBase {
  /** 动画目标元素的 id。 */
  target: string;
  /** 动作时间配置；未指定的字段依次继承最近的分组、Step、Player 和默认值。 */
  transition?: Transition;
  /** 动画开始前直接设置的样式，不参与动画插值。 */
  before?: AnimationState;
  /** 动画完成后直接设置的样式，不参与动画插值。 */
  after?: AnimationState;
}

export interface AnimateFromToProps extends AnimationBase {
  /** 动画起始样式；省略时使用目标在播放时的当前样式。 */
  from?: AnimationState;
  /** 动画终点样式，与 keyframes 二选一。 */
  to: AnimationState;
  keyframes?: never;
}

export interface AnimateKeyframesProps extends AnimationBase {
  /** 按顺序播放的样式关键帧，与 from / to 二选一。 */
  keyframes: readonly AnimationState[];
  from?: never;
  to?: never;
}

/** 起终点与多段关键帧二选一，避免同一动作有两套状态来源。 */
export type AnimateProps = AnimateFromToProps | AnimateKeyframesProps;

export interface EffectProps {
  target: string;
  transition?: Transition;
}
