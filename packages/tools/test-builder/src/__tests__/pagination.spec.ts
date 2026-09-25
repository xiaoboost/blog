import { getPageIndexes } from '@blog/shared';
import { describe, expect, it } from '@blog/test-toolkit';

describe('分页页码', () => {
  it('少量页码完整显示，大量页码保留首尾及当前位置', () => {
    expect(getPageIndexes(1, 3)).deep.eq([
      0, 1, 2,
    ]);
    expect(getPageIndexes(0, 20)).deep.eq([
      0, 1, 2, 3, 4, 'gap', 19,
    ]);
    expect(getPageIndexes(9, 20)).deep.eq([
      0, 'gap', 8, 9, 10, 'gap', 19,
    ]);
    expect(getPageIndexes(19, 20)).deep.eq([
      0, 'gap', 15, 16, 17, 18, 19,
    ]);
  });

  it('跨越省略号边界时没有越界、重复或遗漏当前页', () => {
    for (let count = 1; count <= 40; count++) {
      for (let index = 0; index < count; index++) {
        const items = getPageIndexes(index, count);
        const pages = items.filter((item): item is number => typeof item === 'number');
        expect(items.length).at.most(7);
        expect(pages).include(index);
        expect(pages[0]).eq(0);
        expect(pages.at(-1)).eq(count - 1);
        expect([...new Set(pages)].sort((a, b) => a - b)).deep.eq(pages);
      }
    }
  });
});
