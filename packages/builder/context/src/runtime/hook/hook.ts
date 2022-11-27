import { forEachStack, forOnceStack, isFirstRun, SetupHook } from './store';

/** 每次运行都会调用 */
export function forEach(setup: SetupHook) {
  forEachStack.push(setup);
}

/** 只在首次运行调用 */
export function forOnce(setup: SetupHook) {
  if (!isFirstRun.get()) {
    return;
  }

  forOnceStack.push(setup);
}
