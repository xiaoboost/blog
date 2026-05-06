import { cssVar } from '../theme';

// 时长常量（单位：秒）
export const DURATION_INSTANT = 0.1;
export const DURATION_FAST = 0.2;
export const DURATION_NORMAL = 0.4;
export const DURATION_SLOW = 0.8;

/** @see {@link DurationInstant} */
export const DurationInstantToken = '--duration-instant';
/**
 * 瞬间过渡 — 0.1s
 *
 * @description 用于即时反馈的微交互。
 */
export const DurationInstant = cssVar(DurationInstantToken);

/** @see {@link DurationFast} */
export const DurationFastToken = '--duration-fast';
/**
 * 快速过渡 — 0.2s
 *
 * @description 用于 hover 状态切换、颜色渐变等常规交互。
 */
export const DurationFast = cssVar(DurationFastToken);

/** @see {@link DurationNormal} */
export const DurationNormalToken = '--duration-normal';
/**
 * 常规过渡 — 0.4s
 *
 * @description 用于展开/收起、淡入/淡出等中等时长动画。
 */
export const DurationNormal = cssVar(DurationNormalToken);

/** @see {@link DurationSlow} */
export const DurationSlowToken = '--duration-slow';
/**
 * 慢速过渡 — 0.8s
 *
 * @description 用于大范围动画（如模糊揭示）。
 */
export const DurationSlow = cssVar(DurationSlowToken);
