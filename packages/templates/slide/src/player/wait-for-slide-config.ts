import { waitForBrowserConfig } from '@blog/context/web';
import type { SlideConfig } from '@blog/types';

/** 检查 PPT 配置格式 */
function isSlideConfig(value: unknown): value is SlideConfig {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const config = value as Partial<SlideConfig>;
  return Array.isArray(config.sections) && config.sections.length > 0
    && config.sections.every((section) => section && Array.isArray(section.steps)
      && section.steps.every((step) => step && Array.isArray(step.actions)));
}

/** 读取 PPT 配置 */
export async function waitForSlideConfig(
  signal: AbortSignal,
  timeout = 8000,
): Promise<SlideConfig> {
  const { slide } = await waitForBrowserConfig(signal, timeout);

  if (!isSlideConfig(slide)) {
    throw new Error('幻灯片动画配置无效。');
  }

  return slide;
}
