import { hyphenate } from '@xiao-ai/utils';

import { hash } from './hash';

/**
 * 生成确定性类名。
 *
 * @param key   class 原始名（camelCase）
 * @param salt  盐值，用于跨文件去重（通常为 `JSON.stringify(styles)`）
 * @returns      kebab-case-hash 格式的类名
 */
export function generateClassName(key: string, salt?: string): string {
  const kebab = hyphenate(key);
  const input = salt ? `${salt}:${key}` : key;
  return `${kebab}-${hash(input)}`;
}
