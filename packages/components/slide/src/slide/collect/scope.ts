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
