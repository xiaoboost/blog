import type { AnimationState, ResolvedTransition, Transition } from './types';

export const defaultTransition: Readonly<ResolvedTransition> = {
  duration: 300,
  delay: 0,
  easing: 'ease-out',
};

/** 按字段覆盖；undefined 继承，0 有效，不修改输入对象。 */
export function mergeTransition(...levels: (Transition | undefined)[]): ResolvedTransition {
  const result = { ...defaultTransition };
  for (const level of levels) {
    if (level === undefined) {
      continue;
    }

    if (level === null || typeof level !== 'object' || Array.isArray(level)) {
      throw new Error('[mdx-slide] transition 必须是配置对象。');
    }

    for (const [key, value] of Object.entries(level)) {
      if (!['duration', 'delay', 'easing'].includes(key)) {
        throw new Error(`[mdx-slide] transition 不支持字段 ${key}。`);
      }

      if (value === undefined) {
        continue;
      }

      if (key === 'duration' || key === 'delay') {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
          throw new Error(`[mdx-slide] transition.${key} 必须是非负有限数值。`);
        }

        result[key] = value;
      }
      else {
        if (typeof value !== 'string' || !value.trim()) {
          throw new Error('[mdx-slide] transition.easing 必须是非空字符串。');
        }

        result.easing = value;
      }
    }
  }
  return result;
}

export function normalizeState(
  value: AnimationState,
  name: string,
  required = false,
): AnimationState {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`[mdx-slide] ${name} 必须是动画状态对象。`);
  }

  const result: AnimationState = {};
  for (const [key, field] of Object.entries(value)) {
    if (![
      'opacity',
      'transform',
      'color',
      'backgroundColor',
      'visibility',
    ].includes(key)) {
      throw new Error(`[mdx-slide] ${name} 不支持字段 ${key}。`);
    }

    if (field === undefined) {
      continue;
    }

    if (key === 'opacity') {
      if (typeof field !== 'number' || !Number.isFinite(field) || field < 0 || field > 1) {
        throw new Error(`[mdx-slide] ${name}.opacity 必须在 0 到 1 之间。`);
      }
    }
    else if (key === 'visibility') {
      if (field !== 'visible' && field !== 'hidden') {
        throw new Error(`[mdx-slide] ${name}.visibility 必须是 visible 或 hidden。`);
      }
    }
    else if (typeof field !== 'string' || !field.trim()) {
      throw new Error(`[mdx-slide] ${name}.${key} 必须是非空字符串。`);
    }

    Object.assign(result, { [key]: field });
  }

  if (required && Object.keys(result).length === 0) {
    throw new Error(`[mdx-slide] ${name} 至少需要一个终点属性。`);
  }

  return result;
}
