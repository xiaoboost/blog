import type {
  AnimateKeyframesProps,
  AnimateProps,
  AnimationState,
  Position,
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
    if (level?.duration !== undefined) {
      assertTime(level.duration, 'transition.duration');
    }

    if (level?.delay !== undefined) {
      assertTime(level.delay, 'transition.delay');
    }

    result.duration = level?.duration ?? result.duration;
    result.delay = level?.delay ?? result.delay;
    result.easing = level?.easing ?? result.easing;
  }
  return result;
}

/** 时长和解析后的时间都必须是有限的非负数字，避免序列化为 null。 */
export function assertTime(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`[mdx-slide] ${label} 必须是有限的非负毫秒数。`);
  }
}

/** JS / MDX 也可能绕过类型检查，不能悄悄忽略放错位置的 at。 */
export function assertNoPosition(props: object): void {
  if ('at' in props && props.at !== undefined) {
    throw new Error('[mdx-slide] at 只能用于 Step 或 Parallel 内的 Sequence / Parallel。');
  }
}

/** 引用在编排解析时检查，这里只验证输入并复制，避免后续渲染修改来源对象。 */
export function normalizePosition(at: Position | undefined): Position | undefined {
  if (at === undefined) {
    return undefined;
  }

  if (typeof at === 'number') {
    assertTime(at, 'at');
    return at;
  }

  if (
    !at || typeof at !== 'object'
    || typeof at.ref !== 'string' || !at.ref.trim()
    || (at.edge !== 'start' && at.edge !== 'end')
    || (at.offset !== undefined && !Number.isFinite(at.offset))
  ) {
    throw new Error('[mdx-slide] at 必须是毫秒数或 { ref, edge: "start" | "end", offset? }，offset 必须有限。');
  }

  return { ref: at.ref, edge: at.edge, ...(at.offset === undefined ? {} : { offset: at.offset }) };
}

function copyState(value: AnimationState): AnimationState {
  return Object.fromEntries(Object.entries(value).filter(([, field]) => field !== undefined));
}

/** 在登记时复制作者输入，统一成关键帧配置。 */
export function normalizeAction(props: AnimateProps): Omit<AnimateKeyframesProps, 'transition'> {
  const keyframes = props.keyframes
    ?? (props.from === undefined ? [props.to!] : [props.from, props.to!]);

  return {
    target: props.target,
    keyframes: Array.from(keyframes, copyState),
    ...(props.before === undefined ? {} : { before: copyState(props.before) }),
    ...(props.after === undefined ? {} : { after: copyState(props.after) }),
  };
}
