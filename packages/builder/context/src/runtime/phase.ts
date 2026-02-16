import { getAccessor } from './accessor';

/** 构建阶段枚举 */
export enum BuildPhase {
  /** 初始状态 */
  Start,
  /** 预生成阶段 */
  PreBuild,
  /** 正式生成阶段 */
  Build,
  /** 构建完成 */
  Complete,
}

/** 状态机访问器 */
const phaseAccessor = getAccessor<BuildPhase>('buildPhase', BuildPhase.Start);

/**
 * 获取当前构建阶段
 */
export function getPhase(): BuildPhase {
  return phaseAccessor.get() ?? BuildPhase.Start;
}

/**
 * 推进到下一个合法状态
 */
export function nextPhase(): BuildPhase {
  const currentPhase = getPhase();
  const nextPhase = currentPhase + 1;

  if (nextPhase > BuildPhase.Complete) {
    return BuildPhase.Complete;
  }

  phaseAccessor.set(nextPhase);

  return nextPhase;
}

/**
 * 重置到 Start 状态
 */
export function resetPhase(): void {
  phaseAccessor.set(BuildPhase.Start);
}
