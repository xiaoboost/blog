import { tokenize, ready } from './tokenize';
import { ScriptKind, Platform } from './host';

export { ScriptKind, Platform, ready };

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

  debugger;

  /** 行代码 */
  const codeLines: string[] = [];

  return codeLines;
}
