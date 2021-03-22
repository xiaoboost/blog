import { tokenize } from './tokenize';
import { ScriptKind, Platform } from './host';

export { ScriptKind, Platform };

// TODO: 还需要代码缓存缓存
export async function renderTsCode(
  code: string,
  lang: ScriptKind = 'ts',
  platform: Platform = 'browser',
) {
  const linesTokens = await tokenize(
    code,
    lang === 'ts' ? 'ts' : 'tsx',
    platform === 'node' ? 'node' : 'browser',
  );

  debugger;

  return code;
}
