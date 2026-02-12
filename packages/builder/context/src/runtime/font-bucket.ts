import { getAccessorWithGetter } from './accessor';

export class FontBucket {
  public readonly name: string;

  private readonly chars: Set<string> = new Set();

  constructor(name: string) {
    this.name = name;
  }

  addText(...texts: string[]): void {
    for (const text of texts) {
      if (!text) continue;

      const normalized = text.normalize('NFC');

      for (const ch of normalized) {
        this.chars.add(ch);
      }
    }
  }

  getCharSet(): Set<string> {
    return this.chars;
  }
}

/**
 * 获取指定名称的 FontBucket
 *
 * @description 相同 name 在同一运行时上下文内返回同一实例
 */
export function getFontBucket(name: string): FontBucket {
  const accessor = getAccessorWithGetter<FontBucket>(
    `font-bucket::${name}`,
    () => new FontBucket(name),
  );

  return accessor.get() as FontBucket;
}
