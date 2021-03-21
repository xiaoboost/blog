import * as ts from 'typescript';

interface TsToken {
  /** token 文本 */
  text: string;
  /** token 类型 */
  kind: string;
  /** 提示文本 */
  hover?: string;
}

interface TsCode {
  /** 代码源文本 */
  code: string;
  /** 解析后的 token 列表 */
  tokens: TsToken[];
}

const tsFiles: Record<string, TsCode> = {};


function getTokens(code: string) {
  // ..
}

export function render(code: string) {
  // ..
}
