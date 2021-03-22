import { tokenize } from './tokenize';

// TODO: 还需要一个缓存
export async function renderTsCode(code: string) {
  const linesTokens = await tokenize(code);

  debugger;

  return code;
}
