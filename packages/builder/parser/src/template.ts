import { Fixer } from '@blog/shared';

/** 添加图片模板代码 */
export function encodeImageTemplate(varName: string) {
  return `\`\${${varName}}\``;
}

/** 解码图片模板代码 */
function decodeImageTemplate(input: string, fixer: Fixer) {
  const stringMatcher = /['"]%60[\d\D]*?%60['"]/g;

  let result: RegExpExecArray | null = stringMatcher.exec(input);

  while (result !== null) {
    const startOffset = result.index;
    const endOffset = startOffset + result[0].length;
    const decodeStr = decodeURI(result[0]);
    const templateStr = `{${decodeStr.substring(1, decodeStr.length - 1)}}`;

    fixer.fix({
      start: startOffset,
      end: endOffset,
      newText: templateStr,
    });

    result = stringMatcher.exec(input);
  }
}

/** 解码模板代码 */
export function decodeTemplate(input: string) {
  const fixer = new Fixer(input);

  decodeImageTemplate(input, fixer);

  return fixer.apply();
}
