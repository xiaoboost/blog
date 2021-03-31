import { tokenize, ready } from './tokenize';
import { ScriptKind, Platform, DisplaySymbol } from './host';

export { ScriptKind, Platform, ready, DisplaySymbol };

// TODO: 还需要代码缓存缓存
export function renderTsCode(
  code: string,
  lang: ScriptKind = 'ts',
  platform: Platform = 'browser',
) {
  const linesTokens = tokenize(
    code,
    lang,
    platform === 'node' ? 'node' : 'browser',
  );

  return linesTokens.map((line) => {
    let code = '';

    for (const token of line) {
      if (token.class || token.info) {
        code += '<span';

        if (token.class) {
          code += ` class="${token.class}"`
        }
  
        if (token.info) {
          code += ` ls-info="${token.info}"`;
        }
  
        code += `>${token.text}</span>`;
      }
      else {
        code += token.text;
      }
    }

    return code;
  });
}
