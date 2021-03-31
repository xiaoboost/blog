import vsctm from 'vscode-textmate';
import oniguruma from 'vscode-oniguruma';

import { promises as fs } from 'fs';
import { resolveRoot } from '@build/utils';
import { getTsServer, ScriptKind, Platform, TsServer } from './host';

let tsGrammar: vsctm.IGrammar;
let tsxGrammar: vsctm.IGrammar;

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

/**
 * 分割行首 token
 * 行首的 token 如果有空格，则需要把空格和后面的内容分隔开
 */
function lineStartTokenSplit(token: Token) {
  if (
    token.startIndex !== 0 ||
    !/^ +/.test(token.text) ||
    /^ +$/.test(token.text)
  ) {
    return [token];
  }

  const space = /^ +/.exec(token.text)!;
  const spaceToken: Token = {
    startIndex: 0,
    endIndex: space.length,
    offset: token.offset,
    scopes: [],
    text: space[0],
  };

  return [
    spaceToken,
    {
      startIndex: space.length,
      endIndex: token.endIndex,
      offset: token.offset + space.length,
      scopes: token.scopes,
      text: token.text.substring(space.length),
    },
  ];
}

function getClass(token: Token) {
  const valText = token.text.trim();

  if (valText.length === 0) {
    return;
  }

  const tokenMap = {
    comment: 'hljs-comment',
    'storage.type': 'hljs-keyword',
    'string.quoted': 'hljs-string',
    'entity.name': 'hljs-variable',
  };
  const tokenName = token.scopes.join(' ');
  const tokenKey = Object.keys(tokenMap).find((key) => tokenName.includes(key));

  // if (tokenName.includes('entity.name')) {
  //   debugger;
  // }

  if (!tokenKey) {
    return;
  }

  return tokenKey ? tokenMap[tokenKey] : undefined;
}

function getInfo(server: TsServer, token: Token) {
  const innerText = token.text.trim();
  const noInfoChar: Record<string, boolean> = (
    Array
      .from('{}:();,+-*/.\'"=[]%`<>|^&~!')
      .concat(['=>', '**', '>>', '<<', '>>>', '&&', '||'])
      .concat(['==', '===', '!=', '!==', '>=', '<=', '++', '--'])
      .reduce((ans, item) => (ans[item] = true, ans), {})
  );

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

    linesToken.push(
      lineTokens.tokens
        .map((token) => lineStartTokenSplit({
          ...token,
          offset: token.startIndex + offset,
          text: line.substring(token.startIndex, token.endIndex),
        }))
        .reduce((ans, token) => ans.concat(token), [])
        .map((token) => ({
          ...token,
          class: getClass(token),
          info: getInfo(server, token),
        }))
    );

    offset += line.length + 1;
    ruleStack = lineTokens.ruleStack;
  }

  return linesToken;
}
