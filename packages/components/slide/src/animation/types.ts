import type { ReactNode } from 'react';

export interface ResolvedTransition {
  duration: number;
  delay: number;
  easing: string;
}

export type Transition = Partial<ResolvedTransition>;

export interface AnimationState {
  opacity?: number;
  transform?: string;
  color?: string;
  backgroundColor?: string;
  visibility?: 'visible' | 'hidden';
}

export interface PlayerProps {
  children: ReactNode;
  transition?: Transition;
}

export interface StepProps {
  children: ReactNode;
  transition?: Transition;
}

export interface AnimateProps {
  target: string;
  from?: AnimationState;
  to: AnimationState;
  transition?: Transition;
}

export interface EffectProps {
  target: string;
  transition?: Transition;
}

/** 离散样式在动作开始 / 结束时设置，不参与连续插值。 */
export interface ActionConfig {
  target: string;
  from?: AnimationState;
  to: AnimationState;
  transition: ResolvedTransition;
  before?: { visibility?: 'visible' | 'hidden'; transformOrigin?: string };
  after?: { visibility?: 'visible' | 'hidden' };
}

export interface StepConfig {
  actions: ActionConfig[];
}
