import type { AnimateKeyframesProps, Position, ResolvedTransition } from '../../animation/types';

export type GroupKind = 'sequence' | 'parallel';
export type ScopeKind = 'section' | 'player' | 'step' | GroupKind;

export interface PlayerScope {
  transition: ResolvedTransition;
  steps: StepScope[];
}

export interface StepScope {
  transition: ResolvedTransition;
  children: AnimationNode[];
}

export interface GroupScope extends StepScope {
  kind: GroupKind;
  id?: string;
  at?: Position;
}

export type AnimationNode = GroupScope | {
  kind: 'action';
  value: AnimateKeyframesProps & { transition: ResolvedTransition };
} | {
  kind: 'wait';
  duration: number;
};

export interface SectionScope {
  index: number;
  player?: PlayerScope;
}
