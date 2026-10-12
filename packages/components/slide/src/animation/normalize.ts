import type {
  ActionConfig,
  AnimateProps,
  AnimationState,
  ResolvedTransition,
  Transition,
} from './types';

export const defaultTransition: Readonly<ResolvedTransition> = {
  duration: 300,
  delay: 0,
  easing: 'ease-out',
};

/** 按字段覆盖；undefined 继承，0 有效，不修改输入对象。 */
export function mergeTransition(...levels: (Transition | undefined)[]): ResolvedTransition {
  const result = { ...defaultTransition };
  for (const level of levels) {
    result.duration = level?.duration ?? result.duration;
    result.delay = level?.delay ?? result.delay;
    result.easing = level?.easing ?? result.easing;
  }
  return result;
}

function copyState(value: AnimationState): AnimationState {
  return Object.fromEntries(Object.entries(value).filter(([, field]) => field !== undefined));
}

/** 在登记时复制作者输入，统一成关键帧配置。 */
export function normalizeAction(props: AnimateProps): Omit<ActionConfig, 'transition'> {
  const keyframes = props.keyframes
    ?? (props.from === undefined ? [props.to!] : [props.from, props.to!]);

  return {
    target: props.target,
    keyframes: Array.from(keyframes, copyState),
    ...(props.before === undefined ? {} : { before: copyState(props.before) }),
    ...(props.after === undefined ? {} : { after: copyState(props.after) }),
  };
}
