import vsctm from 'vscode-textmate';
import oniguruma from 'vscode-oniguruma';

import { promises as fs } from 'fs';
import { resolveRoot } from '@build/utils';
import { getTsServer, ScriptKind, Platform, TsServer } from './host';

let tsGrammar: vsctm.IGrammar;
let tsxGrammar: vsctm.IGrammar;

const noInfoChar: Record<string, boolean> = (
  Array
    .from('{}:();,+-*/.\'"=[]%`<>|^&~!')
    .concat(['=>', '**', '>>', '<<', '>>>', '&&', '||'])
    .concat(['==', '===', '!=', '!==', '>=', '<=', '++', '--'])
    .reduce((ans, item) => (ans[item] = true, ans), {})
);

interface Token extends vsctm.IToken {
  /** 距离整个代码开头的偏移 */
  offset: number;
  /** 原始字符串 */
  text: string;
  /** 渲染后的标签类名 */
  class?: string;
  /** 代码提示 */
  info?: string;
}

async function getGrammar() {
  const [ts, tsx, wasmBin] = await Promise.all([
    fs.readFile(resolveRoot('tmLanguage/ts.plist'), 'utf-8'),
    fs.readFile(resolveRoot('tmLanguage/tsx.plist'), 'utf-8'),
    fs.readFile(resolveRoot('node_modules/vscode-oniguruma/release/onig.wasm')),
  ]);

  const vscodeOnigurumaLib: Promise<vsctm.IOnigLib> = oniguruma.loadWASM(wasmBin.buffer)
    .then(() => ({
      createOnigScanner: (source: string[]) => new oniguruma.OnigScanner(source),
      createOnigString: (str: string) => new oniguruma.OnigString(str),
    }) as any);

  const registry = new vsctm.Registry({
    onigLib: vscodeOnigurumaLib,
    loadGrammar: (scopeName) => {
      if (scopeName === 'source.ts') {
        return Promise.resolve(vsctm.parseRawGrammar(ts));
      }
      else if (scopeName === 'source.tsx') {
        return Promise.resolve(vsctm.parseRawGrammar(tsx));
      }
      else {
        throw new Error(`Unknown scopeName: ${scopeName}.`)
      }
    },
  });

  tsGrammar = (await registry.loadGrammar('source.ts'))!;
  tsxGrammar = (await registry.loadGrammar('source.tsx'))!;

  return [
    tsGrammar,
    tsxGrammar,
  ];
}

function getClass(token: Token) {
  const valText = token.text.trim();

  if (valText.length === 0) {
    return '';
  }

  return token.scopes
    .filter((name) => name !== 'source.ts')
    .map((tag) => `ls-${tag.replace(/\./g, '-')}`)
    .join(' ');
}

function getInfo(server: TsServer, token: Token) {
  const innerText = token.text.trim();

  if (innerText.length === 0 || noInfoChar[innerText]) {
    return;
  }

  const info = server.getQuickInfoAtPosition(token.offset);

  if (!info) {
    return;
  }

  return info;
}

export const ready = getGrammar();

export function tokenize(
  code: string,
  lang: ScriptKind = 'ts',
  platform: Platform = 'browser',
) {
  const server = getTsServer(lang, platform)
  const grammar = /^(j|t)s$/.test(lang) ? tsGrammar : tsxGrammar;
  const lines = code.split(/[\n\r]/);
  const linesToken: Token[][] = [];

  server.setFile(code);

  let ruleStack = vsctm.INITIAL;
  let offset = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineTokens = grammar.tokenizeLine(line, ruleStack);

    linesToken.push(lineTokens.tokens.map((token) => {
      const text = line.substring(token.startIndex, token.endIndex);
      const indexOffset = token.startIndex + offset;
      const tokenData: Token = {
        ...token,
        offset: indexOffset,
        class: '',
        info: '',
        text,
      };

      tokenData.class = getClass(tokenData);
      tokenData.info = getInfo(server, tokenData);

      return tokenData;
    }));

    offset += line.length + 1;
    ruleStack = lineTokens.ruleStack;
  }

  return linesToken;
}
