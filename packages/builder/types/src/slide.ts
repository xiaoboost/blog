import type { CSSProperties } from 'react';

/** 样式输入范围 */
export type AnimationState = CSSProperties;

export interface ResolvedTransition {
  /** 动作的播放时长，单位毫秒。 */
  duration: number;
  /** 每个动作开始前的等待，单位毫秒；收集后合并到 ActionConfig.start。 */
  delay: number;
  easing: string;
}

/** 已展开编排关系的动作配置，时间单位均为毫秒。 */
export interface ActionConfig {
  /** 动画目标元素的 id。 */
  target: string;
  /** 按顺序播放的样式关键帧。 */
  keyframes: readonly AnimationState[];
  from?: never;
  to?: never;
  /** 动画开始前直接设置的样式，不参与动画插值。 */
  before?: AnimationState;
  /** 动画完成后直接设置的样式，不参与动画插值。 */
  after?: AnimationState;
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

export interface SectionConfig {
  steps: StepConfig[];
}

/** PPT 配置 */
export interface SlideConfig {
  sections: SectionConfig[];
}
