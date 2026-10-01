import { useRenderContext } from './render-context';

/**
 * 在预渲染阶段，为当前页面已注册的字体收集文字。
 * 字体注册和构建仍由模板负责，组件只需要提供字体名称与实际显示的文字。
 */
export function useFontText(family: string, ...texts: string[]): void {
  const context = useRenderContext();

  if (context?.isPreBuild) {
    context.page.getFontBucket(family).addText(...texts);
  }
}
