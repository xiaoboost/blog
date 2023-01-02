import { Fixer } from '@blog/shared';

function visitTemplate(input: string, cb: (str: string, index: number) => void) {
  const stringMatcher = /['"]%60[\d\D]*%60['"]/;

  let start = 0;
  let content = input;
  let result = content.match(stringMatcher);

  while (result) {
    const startOffset = start + result.index!;
    const endOffset = startOffset + result[0].length;

    cb(result[0], startOffset);

    start = endOffset;
    content = content.substring(endOffset, content.length);
    result = content.match(stringMatcher);
  }
}

/** 解码模板 */
export function decodeTemplate(input: string) {
  const fixer = new Fixer(input);

  visitTemplate(input, (str, index) => {
    const decodeStr = decodeURI(str);
    const templateStr = decodeStr.substring(1, decodeStr.length - 1);

    fixer.fix({
      start: index,
      end: index + str.length,
      newText: templateStr,
    });
  });

  return fixer.apply();
}
