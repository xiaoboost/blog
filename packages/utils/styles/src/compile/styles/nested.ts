/**
 * 嵌套选择器解析。
 *
 * 规则：
 *   `&`    → 替换为父选择器
 *   `$x`   → 替换为 `.hashed-class`（从 classMap 查找）
 *   无 `&`  → 隐式在开头补 `parentSelector `
 *   逗号分隔 → 逐段处理后重新 join
 */

/** 逗号分隔符（选择器分组） */
const COMMA_RE = /\s*,\s*/;

/** & 引用符 */
const AMP_RE = /&/g;

/** $ref 引用符 */
const REF_RE = /\$([\w-]+)/g;

/**
 * 解析嵌套选择器 key → 完整 CSS 选择器。
 *
 * 规则：
 *   `&`    → 替换为父选择器
 *   `$x`   → 替换为 `.hashed-class`
 *   无 `&`  → 隐式前缀 `parentSelector `
 *   父 / 子含逗号 → 叉积展开：`.a, .b` 的子 `& li` → `.a li, .b li`
 */
export function resolveSelector(
  nested: string,
  parent: string,
  classMap: Record<string, string>,
): string {
  const nestedParts = nested.split(COMMA_RE);
  const parentParts = parent.split(COMMA_RE);
  const resolved: string[] = [];

  for (const p of parentParts) {
    const pt = p.trim();
    if (!pt) continue;
    for (const n of nestedParts) {
      resolved.push(resolveSingle(n.trim(), pt, classMap));
    }
  }

  return resolved.join(', ');
}

/**
 * 解析单段选择器（不含逗号）。
 */
function resolveSingle(
  nested: string,
  parent: string,
  classMap: Record<string, string>,
): string {
  let result: string;

  if (nested.includes('&')) {
    result = nested.replace(AMP_RE, parent);
  }
  else {
    // 无 & → 隐式前缀父选择器
    result = `${parent} ${nested}`;
  }

  // 替换 $ref → 实际 class 名
  result = result.replace(REF_RE, (_match, ref) => {
    const className = classMap[ref];
    if (className) return `.${className}`;
    return `.${ref}`; // fallback：未找到引用时保持原样
  });

  return result;
}
