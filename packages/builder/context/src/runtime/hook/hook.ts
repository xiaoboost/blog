import type { OnBuild, OnBuildWithRender, OnInit } from '@blog/types';
import { useRenderContext } from '../render-context';
import {
  buildStack,
  initStack,
  isFirstRun,
} from './store';

/** 每次构建都会调用 */
export const onBuild: OnBuild = (setup) => {
  buildStack.push(setup);
};

/** 注册构建初始化逻辑，并返回读取当前渲染上下文的 hook */
export const onBuildWithRender: OnBuildWithRender = (setup) => {
  let render: ReturnType<typeof setup> | undefined;

  onBuild((runtime) => {
    render = setup(runtime);
  });

  return function useBuildRender(input) {
    const context = useRenderContext();

    if (!render) {
      throw new Error('onBuildWithRender 的渲染 hook 需要在构建初始化完成后调用');
    }

    if (!context) {
      throw new Error('onBuildWithRender 的渲染 hook 需要在 RenderContext 中调用');
    }

    return render(input, context);
  };
};

/** 只在首次构建调用，在 onBuild 之前执行 */
export const onInit: OnInit = (setup) => {
  if (!isFirstRun.get()) {
    return;
  }

  initStack.push(setup);
};
