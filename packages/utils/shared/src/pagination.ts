/** 保留首尾页与当前页附近的页码，最多显示七项；页索引从 0 开始。 */
export function getPageIndexes(index: number, count: number): (number | 'gap')[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i);
  if (index <= 3) return [
    0, 1, 2, 3, 4, 'gap', count - 1,
  ];
  if (index >= count - 4) return [
    0, 'gap', count - 5, count - 4, count - 3, count - 2, count - 1,
  ];
  return [
    0, 'gap', index - 1, index, index + 1, 'gap', count - 1,
  ];
}
