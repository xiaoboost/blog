import type { SlideConfig } from './slide';

/** 页面配置 */
export interface BrowserConfig {
  /** PPT 配置 */
  slide?: SlideConfig;
  /** 异步脚本配置 */
  lazyScripts?: Record<string, readonly string[]>;
}
