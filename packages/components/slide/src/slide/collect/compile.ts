import { assertTime, normalizeAction } from '../../animation/normalize';
import type { ActionConfig, Position, StepConfig } from '../../animation/types';
import type { AnimationNode, GroupKind, StepScope } from './scope';

interface Interval {
  start: number;
  end: number;
}

function position(at: Position | undefined, siblings: Map<string, Interval>, path: string): number {
  if (at === undefined) {
    return 0;
  }

  if (typeof at === 'number') {
    return at;
  }

  const reference = siblings.get(at.ref);

  if (!reference) {
    throw new Error(`[mdx-slide] ${path} 的 at 引用 ${JSON.stringify(at.ref)} 无效；只能引用同一父容器内先声明的分组。`);
  }

  const start = reference[at.edge] + (at.offset ?? 0);
  assertTime(start, `${path} 的 at 解析结果`);
  return start;
}

function timeSum(a: number, b: number, label: string): number {
  const result = a + b;
  assertTime(result, label);
  return result;
}

/**
 * 预渲染先收集树，再把一个 Step 编译成绝对偏移的动作表。
 * 每层只保留先前兄弟分组的区间，引用不会穿越作用域，也不会形成循环。
 */
export function compileStep(step: StepScope, path: string): StepConfig {
  const actions: ActionConfig[] = [];

  function visit(children: AnimationNode[], kind: GroupKind, origin: number, path: string): number {
    const siblings = new Map<string, Interval>();
    let duration = 0;

    for (const [index, node] of children.entries()) {
      const group = node.kind === 'sequence' || node.kind === 'parallel' ? node : undefined;
      const label = group
        ? `${path} / ${group.kind === 'sequence' ? 'Sequence' : 'Parallel'} ${group.id === undefined ? index + 1 : JSON.stringify(group.id)}`
        : `${path} / 子项 ${index + 1}`;

      if (group?.id !== undefined && siblings.has(group.id)) {
        throw new Error(`[mdx-slide] ${label} 的 id 重复；分组 id 必须在同一父容器内唯一。`);
      }

      if (kind === 'sequence' && group?.at !== undefined) {
        throw new Error(`[mdx-slide] ${label} 不能设置 at：Sequence 的直接子项必须依次执行。`);
      }

      const start = kind === 'sequence' ? duration : position(group?.at, siblings, label);
      const absoluteStart = timeSum(origin, start, `${label} 的开始时间`);
      let childDuration: number;

      if (node.kind === 'action') {
        const { delay, duration, easing } = node.value.transition;
        const start = timeSum(absoluteStart, delay, `${label} 的动作开始时间`);
        childDuration = timeSum(delay, duration, `${label} 的动作占用时间`);
        timeSum(start, duration, `${label} 的动作结束时间`);
        actions.push({ ...normalizeAction(node.value), start, transition: { duration, easing } });
      }
      else if (node.kind === 'wait') {
        childDuration = node.duration;
      }
      else {
        childDuration = visit(node.children, node.kind, absoluteStart, label);
      }

      const end = timeSum(start, childDuration, `${label} 的结束时间`);
      timeSum(origin, end, `${label} 相对 Step 的结束时间`);

      if (group?.id !== undefined) {
        siblings.set(group.id, { start, end });
      }

      duration = Math.max(duration, end);
    }

    return duration;
  }

  return { duration: visit(step.children, 'parallel', 0, path), actions };
}
