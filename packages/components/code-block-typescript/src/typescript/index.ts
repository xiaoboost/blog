import { escape } from 'html-escaper';
import { addSplitLabel } from '@blog/mdx-code-block-normal';
import { tokenize } from './tokenize';
import { lsInfoAttrName } from '../constant';
import { ScriptKind, Platform, DisplaySymbol } from './host';

export { ScriptKind, Platform, DisplaySymbol };

export function renderTsCode(
  code: string,
  tabWith: number,
  lang: ScriptKind = 'ts',
  platform: Platform = 'browser',
) {
  const linesTokens = tokenize(code, lang, platform === 'node' ? 'node' : 'browser');
  const lineCodes = linesTokens.map((line) => {
    let code = '';

    for (const token of line) {
      if (token.class || token.info) {
        code += '<span';

        if (token.class) {
          code += ` class="${token.class}"`;
        }

        if (token.info) {
          code += ` ${lsInfoAttrName}="${token.info}"`;
        }

        code += `>${escape(token.text)}</span>`;
      } else {
        code += escape(token.text);
      }
    }

    return code;
  });

  return addSplitLabel(lineCodes, tabWith);
}
