/**
 * djb2 确定性 hash 算法。
 *
 * 出处：http://www.cse.yorku.ca/~oz/hash.html
 * 使用场景：Redis、nginx、Node.js 内部等。
 */
export function hash(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
  }
  return (h >>> 0).toString(36).slice(0, 6).padStart(6, '0');
}
