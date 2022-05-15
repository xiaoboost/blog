import { tokenize, ready } from './tokenize';
import { lsInfoAttrName } from '../constant';
import { ScriptKind, Platform, DisplaySymbol } from './host';
import { splitTag, getLineSpaceWidth } from '@blog/mdx-code-block-normal';

export { ScriptKind, Platform, ready, DisplaySymbol };

const blockPairs = [
  ['{', '}'],
  ['${', '}'],
  ['(', ')'],
  ['[', ']'],
  ['<', '>'],
];

const isBlockStart = (text: string) => {
  return Boolean(blockPairs.find((item) => item[0] === text));
};

const isBlockEnd = (text: string) => {
  return Boolean(blockPairs.find((item) => item[1] === text));
};

export function renderTsCode(
  code: string,
  tabWith: number,
  lang: ScriptKind = 'ts',
  platform: Platform = 'browser',
) {
  const linesTokens = tokenize(code, lang, platform === 'node' ? 'node' : 'browser');

  let blockCount = 0;

  const tabString = Array(tabWith).fill(' ').join('');

  const lineCodes = linesTokens.map((line) => {
    let code = '';

    let currentBlockCount = blockCount;

    for (const token of line) {
      const textTrim = token.text.trim();

      // if (textTrim === 'throw') {
      //   debugger;
      // }

      if (isBlockStart(textTrim)) {
        currentBlockCount++;
      } else if (isBlockEnd(textTrim)) {
        currentBlockCount--;
      }

      if (token.class || token.info) {
        code += '<span';

        if (token.class) {
          code += ` class="${token.class}"`;
        }

        if (token.info) {
          code += ` ${lsInfoAttrName}="${token.info}"`;
        }

        code += `>${token.text}</span>`;
      } else {
        code += token.text;
      }
    }

    // 缩减 tab 需要即可生效
    if (currentBlockCount < blockCount) {
      blockCount--;

      if (blockCount < 0) {
        blockCount = 0;
      }
    }

    if (code.length > 0) {
      const spaceWidth = getLineSpaceWidth(code);
      const tabNumber = Math.floor(spaceWidth / tabWith);

      if (tabNumber > 0 && !Number.isNaN(tabNumber)) {
        const splitNumber = Math.min(blockCount, tabNumber);
        const splitCode = Array(blockCount).fill(`${splitTag}${tabString}`).join('');
        const splitString = Array(splitNumber).fill(tabString).join('');

        code = code.replace(new RegExp(`^${splitString}`), splitCode);
      }
    } else if (code.length === 0 && blockCount > 0) {
      code = Array(blockCount).fill(`${splitTag}${tabString}`).join('');
    }

    // 增加 tab 需要下一行生效
    if (currentBlockCount > blockCount) {
      blockCount++;
    }

    return code;
  });

  return lineCodes;
}
