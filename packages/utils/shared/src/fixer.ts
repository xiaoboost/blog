export interface FixData {
  /** 修改字符串在原文起始位置 */
  start: number;
  /** 修改字符串在原文重点位置 */
  end: number;
  /**
   * 替换的新文本
   *   - 若为空，则删除原文
   */
  newText?: string;
}

export class Fixer {
  /** 文本字符串 */
  private content: string;

  /** 修正数据 */
  private fixData: FixData[] = [];

  constructor(content: string) {
    this.content = content;
  }

  /** 当前文本 */
  getContent() {
    return this.content;
  }

  /** 新增修复 */
  fix(data: FixData) {
    this.fixData.push({ ...data });
  }

  /** 在文本开头追加 */
  insert(text: string) {
    this.fix({
      start: 0,
      end: 0,
      newText: text,
    });
  }

  /** 在文本最后追加 */
  append(text: string) {
    this.fix({
      start: this.content.length,
      end: this.content.length,
      newText: text,
    });
  }

  /** 应用所有修改 */
  apply() {
    const { fixData: data } = this;
    let { content } = this;

    // 按 start 位置从大到小排序（从后往前处理）
    const sortedData = [...data].sort((a, b) => b.start - a.start);

    for (const item of sortedData) {
      const startTxt = content.substring(0, item.start);
      const endTxt = content.substring(item.end);
      content = startTxt + (item.newText ?? '') + endTxt;
    }

    data.length = 0;
    this.content = content;

    return content;
  }
}
