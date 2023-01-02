import { forEachStack, forOnceStack, isFirstRun, EachSetupHook, OnceSetupHook } from './store';

/** 每次运行都会调用 */
export function forEach(setup: EachSetupHook) {
  forEachStack.push(setup);
}

/**
 * 只在首次运行调用
 *   - 首次调用时，在`forEach之前的要早
 */
export function forOnce(setup: OnceSetupHook) {
  if (!isFirstRun.get()) {
    return;
  }

  forOnceStack.push(setup);
}
