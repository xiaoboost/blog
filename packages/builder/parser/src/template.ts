import { Fixer } from '@blog/shared';

/** 添加图片模板代码 */
export function encodeImageTemplate(varName: string) {
  return `\`\${${varName}}\``;
}

/** 解码图片模板代码 */
function decodeImageTemplate(input: string, fixer: Fixer) {
  const stringMatcher = /['"]%60[\d\D]*%60['"]/;

  let start = 0;
  let content = input;
  let result = content.match(stringMatcher);

  while (result) {
    const startOffset = start + result.index!;
    const endOffset = startOffset + result[0].length;
    const decodeStr = decodeURI(result[0]);
    const templateStr = `{${decodeStr.substring(1, decodeStr.length - 1)}}`;

    fixer.fix({
      start: startOffset,
      end: startOffset + result[0].length,
      newText: templateStr,
    });

    start = endOffset;
    content = content.substring(endOffset, content.length);
    result = content.match(stringMatcher);
  }
}

/** 解码模板代码 */
export function decodeTemplate(input: string) {
  const fixer = new Fixer(input);

  decodeImageTemplate(input, fixer);

  return fixer.apply();
}
