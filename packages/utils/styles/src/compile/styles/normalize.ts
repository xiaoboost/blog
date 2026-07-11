import { hyphenate } from '@xiao-ai/utils';

/** CSS 属性名 → 默认单位映射 */
const UNIT_MAP: Record<string, string> = {
  width: 'px', 'min-width': 'px', 'max-width': 'px',
  height: 'px', 'min-height': 'px', 'max-height': 'px',
  top: 'px', right: 'px', bottom: 'px', left: 'px',
  margin: 'px', 'margin-top': 'px', 'margin-right': 'px', 'margin-bottom': 'px', 'margin-left': 'px',
  padding: 'px', 'padding-top': 'px', 'padding-right': 'px', 'padding-bottom': 'px', 'padding-left': 'px',
  'font-size': 'px',
  'border-radius': 'px',
  'border-width': 'px',
  'line-height': '',
  'flex-grow': '', 'flex-shrink': '', 'flex-basis': 'px',
  opacity: '',
  'z-index': '',
  'font-weight': '',
  order: '',
};

/**
 * camelCase → kebab-case
 */
export function normalizeKey(key: string): string {
  return hyphenate(key);
}

/**
 * 规范化 CSS 属性值
 *   - number → 补 px（对需要单位的属性）
 *   - number[] → 逐元素处理后 join(' ')
 *   - string → 原样
 */
export function normalizeValue(key: string, value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((v) => normalizeValue(key, v)).join(' ');
  }
  if (typeof value === 'number') {
    const unit = UNIT_MAP[hyphenate(key)] ?? 'px';
    if (value === 0 && unit === 'px') return '0';
    return unit ? `${value}${unit}` : String(value);
  }
  return String(value);
}
