import { type BuildHook, type InitHook, buildStack, initStack, isFirstRun } from './store';

/** 每次构建都会调用 */
export function onBuild(setup: BuildHook) {
  buildStack.push(setup);
}

/**
 * 只在首次构建调用
 *   - 在 `onBuild` 之前执行
 */
export function onInit(setup: InitHook) {
  if (!isFirstRun.get()) {
    return;
  }

  initStack.push(setup);
}
