import Color from 'color';

export { Color };

/**
 * 基础调色盘
 *
 * @description
 * 纯粹的色值集合，按色系与明度阶梯组织，不做语义映射。
 *
 * @remarks
 * 所有值均为 {@link Color} 实例，方便上层做 alpha / lighten / darken 等计算。
 * 语义 token 在上层基于此调色盘做亮 / 暗两套映射。
 *
 * 阶梯命名规则：0 → 最高明度，500 → 基准纯度，950 → 最低明度。
 * 灰色系是博客核心色系，承载文字、背景、边框、阴影的全部非彩色信息层级。
 */

/**
 * 灰色系
 *
 * @description
 * 博客核心色系。
 *
 * @remarks
 * 12 个阶梯覆盖从纯白到近黑的完整明度范围。
 * 色调偏冷（h ≈ 222°），饱和度极低（s ≤ 8%），视觉上清冷静谧。
 *
 * 明度分布：
 * - `0`–`200` → 高明度（亮色端）
 * - `300`–`600` → 中明度
 * - `700`–`950` → 低明度（暗色端）
 */
export const Gray = {
  /**
   * 纯白
   *
   * @description
   * 最高明度，无色相无饱和度。
   */
  0: Color('#ffffff'),

  /**
   * 近白
   *
   * @description
   * 极高明度，略带冷调。
   */
  50: Color('#f8f8f9'),

  /**
   * 极浅灰
   *
   * @description
   * 高明度极浅灰。
   */
  100: Color('#f3f4f6'),

  /**
   * 浅灰
   *
   * @description
   * 高明度浅灰。
   */
  200: Color('#e5e7eb'),

  /**
   * 中浅灰
   *
   * @description
   * 中高明度灰。
   */
  300: Color('#c0c4cc'),

  /**
   * 中灰
   *
   * @description
   * 中明度灰。
   */
  400: Color('#909399'),

  /**
   * 中深灰
   *
   * @description
   * 中低明度灰。
   */
  500: Color('#606266'),

  /**
   * 过渡灰
   *
   * @description
   * 衔接中段与深色段。
   */
  600: Color('#494c53'),

  /**
   * 深灰
   *
   * @description
   * 低明度深灰。
   */
  700: Color('#303133'),

  /**
   * 暗灰
   *
   * @description
   * 低明度暗灰。
   */
  800: Color('#24262c'),

  /**
   * 深暗灰
   *
   * @description
   * 极低明度深暗灰。
   */
  900: Color('#1b1d22'),

  /**
   * 极深灰
   *
   * @description
   * 最低明度极深灰，逼近纯黑。
   */
  950: Color('#111215'),
} as const;

/**
 * 蓝色系
 *
 * @description
 * 冷调蓝色系。
 *
 * @remarks
 * 高明度阶梯偏粉蓝，低明度阶梯偏靛蓝。
 */
export const Blue = {
  /**
   * 极浅蓝
   *
   * @description
   * 高明度极浅蓝。
   */
  100: Color('#e6f4ff'),

  /**
   * 浅蓝
   *
   * @description
   * 高明度浅蓝。
   */
  200: Color('#b3dfff'),

  /**
   * 中蓝
   *
   * @description
   * 中高明度蓝。
   *
   * TODO: 继承自旧版 `BlueLight`。
   */
  300: Color('#69c0ff'),

  /**
   * 亮蓝
   *
   * @description
   * 中明度亮蓝。
   */
  400: Color('#40a9ff'),

  /**
   * 标准蓝
   *
   * @description
   * 中低明度标准蓝。
   *
   * TODO: 继承自旧版 `Blue`。
   */
  500: Color('#1890ff'),
} as const;

/**
 * 红色系
 *
 * @description
 * 暖调红色系。
 *
 * @remarks
 * 高明度阶梯偏粉，低明度阶梯偏深红。
 */
export const Red = {
  /**
   * 极浅红
   *
   * @description
   * 高明度极浅红。
   */
  100: Color('#fff0f1'),

  /**
   * 浅红
   *
   * @description
   * 高明度浅红。
   */
  200: Color('#ffcdd2'),

  /**
   * 中红
   *
   * @description
   * 中高明度红。
   *
   * TODO: 继承自旧版 `RedLight`。
   */
  300: Color('#ff6969'),

  /**
   * 亮红
   *
   * @description
   * 中明度亮红。
   */
  400: Color('#e84555'),

  /**
   * 标准红
   *
   * @description
   * 中低明度标准红。
   *
   * TODO: 继承自旧版 `Red`。
   */
  500: Color('#d41324'),
} as const;

/**
 * 黄色系
 *
 * @description
 * 暖调黄色系。
 *
 * @remarks
 * 高明度阶梯偏奶油，低明度阶梯偏琥珀。
 */
export const Yellow = {
  /**
   * 极浅黄
   *
   * @description
   * 高明度极浅黄，接近奶油色。
   *
   * TODO: 继承自旧版 `YellowLighter`。
   */
  100: Color('#fef9ed'),

  /**
   * 浅黄
   *
   * @description
   * 高明度浅黄。
   *
   * TODO: 继承自旧版 `YellowLight`。
   */
  200: Color('#ffeaa7'),

  /**
   * 中黄
   *
   * @description
   * 中高明度黄。
   */
  300: Color('#fdd86a'),

  /**
   * 标准黄
   *
   * @description
   * 中明度标准黄。
   *
   * TODO: 继承自旧版 `Yellow`。
   */
  400: Color('#fdcb6e'),

  /**
   * 深黄
   *
   * @description
   * 中低明度深黄，偏琥珀。
   */
  500: Color('#e5a800'),
} as const;

/**
 * 绿色系
 *
 * @description
 * 自然调绿色系。
 *
 * @remarks
 * 高明度阶梯偏嫩芽，低明度阶梯偏橄榄。预留给未来状态标识使用。
 */
export const Green = {
  /**
   * 极浅绿
   *
   * @description
   * 高明度极浅绿。
   */
  100: Color('#f0fae6'),

  /**
   * 浅绿
   *
   * @description
   * 高明度浅绿。
   */
  200: Color('#d7f2b3'),

  /**
   * 中绿
   *
   * @description
   * 中高明度绿。
   *
   * TODO: 继承自旧版 `Green`。
   */
  300: Color('#bae637'),

  /**
   * 亮绿
   *
   * @description
   * 中明度亮绿。
   */
  400: Color('#8fcc1e'),

  /**
   * 深绿
   *
   * @description
   * 中低明度深绿。
   */
  500: Color('#6ba30f'),
} as const;
