import type { ReactNode, CSSProperties } from 'react';

export interface ResolvedTransition {
  duration: number;
  delay: number;
  easing: string;
}

export type Transition = Partial<ResolvedTransition>;

/** 样式输入范围 */
export type AnimationState = CSSProperties;

export interface PlayerProps {
  children: ReactNode;
  transition?: Transition;
}

export interface StepProps {
  children: ReactNode;
  transition?: Transition;
}

export interface AnimationBase {
  /** 动画目标元素的 id。 */
  target: string;
  /** 动作时间配置；未指定的字段依次继承 Step、Player 和默认值。 */
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

/** 收集后的动作配置 */
export interface ActionConfig extends AnimateKeyframesProps {
  transition: ResolvedTransition;
}

export interface StepConfig {
  actions: ActionConfig[];
}
