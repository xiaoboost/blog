import type { Styles } from '@blog/context/runtime';
import { mediaPc, mediaPhone } from './constant';

type MediaParam<T> = {
  pc?: T;
  phone?: T;
  /**
   * 仅 PC 端生效
   *
   * @description 将 `pc` 样式包裹在 `@media (min-width: …)` 中，避免泄漏到手机端
   */
  onlyPc?: boolean;
};

/**
 * 创建响应式样式
 *
 * @description
 * 屏蔽 PC / 手机端的媒体查询细节，使用时直接在对应选择器展开即可。
 *
 * - `pc` 默认直接展开，`phone` 包裹在 `@media (max-width: …)` 中作为覆盖。
 * - 设置 `onlyPc` 时，`pc` 包裹在 `@media (min-width: …)` 中，仅桌面端生效。
 *
 * @example
 * ```ts
 * // 两端对称：pc 为默认，手机端覆盖
 * createMediaStyles({
 *   pc: { width: 900 },
 *   phone: { width: '100%' },
 * });
 *
 * // 仅 PC 端生效
 * createMediaStyles({
 *   pc: { display: 'flex' },
 *   onlyPc: true,
 * });
 *
 * // 仅手机端生效
 * createMediaStyles({
 *   phone: { display: 'none' },
 * });
 * ```
 */
export function createMediaStyles(def: MediaParam<Styles>): Styles {
  return {
    ...(def.pc && !def.onlyPc ? def.pc : {}),
    ...(def.pc && def.onlyPc ? { [mediaPc]: def.pc } : {}),
    ...(def.phone ? { [mediaPhone]: def.phone } : {}),
  };
}

/**
 * 从模板创建响应式样式
 *
 * @description
 * 通过模板函数生成样式，避免为 pc / phone 重复相同的 CSS 结构。
 * 模板函数接收参数值和当前端标识（`'pc'` / `'phone'`），由调用方自行区分逻辑。
 * 内部调用 {@link createMediaStyles}，支持透传 `onlyPc`。
 *
 * @example
 * ```ts
 * // 同一结构，两端只差数值
 * createMediaStylesByTemplate(
 *   (width, media) => ({ width: `${width}px` }),
 *   { pc: 900, phone: 1000 },
 * );
 * ```
 */
export function createMediaStylesByTemplate<T>(
  template: (param: T, media: 'pc' | 'phone') => Styles,
  params: MediaParam<T>,
): Styles {
  return createMediaStyles({
    pc: params.pc ? template(params.pc, 'pc') : undefined,
    phone: params.phone ? template(params.phone, 'phone') : undefined,
    onlyPc: params.onlyPc,
  });
}
