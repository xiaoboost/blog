import type { ResolvedTransition, StepConfig } from '../../animation/types';

export type ScopeKind = 'section' | 'player' | 'step';

export interface PlayerScope {
  transition: ResolvedTransition;
  steps: StepScope[];
}

export interface StepScope extends StepConfig {
  transition: ResolvedTransition;
}

export interface SectionScope {
  index: number;
  player?: PlayerScope;
}

export interface SectionConfig {
  steps: StepConfig[];
}

/** 每个网页一份 PPT，sections 数组下标即内部页索引。 */
export interface SlideConfig {
  version: 1;
  width: number;
  height: number;
  sections: SectionConfig[];
}
