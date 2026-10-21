import type { ReactNode, CSSProperties } from 'react';

export interface ResolvedTransition {
  /** 动作的播放时长，单位毫秒。 */
  duration: number;
  /** 每个动作开始前的等待，单位毫秒；收集后合并到 ActionConfig.start。 */
  delay: number;
  easing: string;
}

export type Transition = Partial<ResolvedTransition>;

/** 样式输入范围 */
export type AnimationState = CSSProperties;

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

/** 已展开编排关系的动作配置，时间单位均为毫秒。 */
export interface ActionConfig extends Omit<AnimateKeyframesProps, 'transition'> {
  /** 相对当前 Step 触发时刻的实际开始时间，已包含 delay。 */
  start: number;
  /** delay 已计入 start，消费配置时无需再次等待。 */
  transition: Omit<ResolvedTransition, 'delay'>;
}

export interface StepConfig {
  /** 最晚结束时间；包含 Wait、延后开始的空分组和末尾等待。 */
  duration: number;
  /** 保留声明顺序，不按 start 排序；同一时刻的动作顺序保持稳定。 */
  actions: ActionConfig[];
}
