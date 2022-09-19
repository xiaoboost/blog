import * as vsctm from 'vscode-textmate';
import * as oniguruma from 'vscode-oniguruma';

import { getTsServer, ScriptKind, Platform, TsServer } from './host';

import tsPlist from '../../tmLanguage/ts.plist';
import tsxPlist from '../../tmLanguage/tsx.plist';
// eslint-disable-next-line import/no-relative-packages
import wasmBin from '../../node_modules/vscode-oniguruma/release/onig.wasm';

let tsGrammar: vsctm.IGrammar;
let tsxGrammar: vsctm.IGrammar;

const tsGrammarCacheKey = 'tsGrammar';
const tsxGrammarCacheKey = 'tsxGrammar';

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
  const cacheTsGrammar = getGlobalVar(tsGrammarCacheKey);
  const cacheTsxGrammar = getGlobalVar(tsxGrammarCacheKey);

  if (cacheTsGrammar && cacheTsxGrammar) {
    tsGrammar = cacheTsGrammar;
    tsxGrammar = cacheTsxGrammar;
    return;
  }

  const wasmContent = await wasmBin.getContent();
  const vscodeOnigurumaLib: Promise<vsctm.IOnigLib> = oniguruma.loadWASM(wasmContent.buffer).then(
    () =>
      ({
        createOnigScanner: (source: string[]) => new oniguruma.OnigScanner(source),
        createOnigString: (str: string) => new oniguruma.OnigString(str),
      } as any),
  );

  const registry = new vsctm.Registry({
    onigLib: vscodeOnigurumaLib,
    loadGrammar: async (scopeName) => {
      if (scopeName === 'source.ts') {
        return vsctm.parseRawGrammar((await tsPlist.getContent()).toString('utf-8'));
      } else if (scopeName === 'source.tsx') {
        return vsctm.parseRawGrammar((await tsxPlist.getContent()).toString('utf-8'));
      } else {
        throw new Error(`Unknown scopeName: ${scopeName}.`);
      }
    },
  });

  tsGrammar = (await registry.loadGrammar('source.ts'))!;
  tsxGrammar = (await registry.loadGrammar('source.tsx'))!;

  setGlobalVar(tsGrammarCacheKey, tsGrammar);
  setGlobalVar(tsxGrammarCacheKey, tsxGrammar);
}

/** 不需要获取语法提示的字符 */
const noInfoChar: Record<string, boolean> = Array.from('{}:();,+-*/.\'"=[]%`<>|^&~!')
  .concat(['=>', '**', '>>', '<<', '>>>', '&&', '||'])
  .concat(['==', '===', '!=', '!==', '>=', '<=', '++', '--'])
  .concat(['new', 'function'])
  .reduce((ans, item) => ((ans[item] = true), ans), {});

/**
 * 分割行首 token
 * 行首的 token 如果有空格，则需要把空格和后面的内容分隔开
 */
function lineStartTokenSplit(token: Token) {
  if (token.startIndex !== 0 || !/^ +/.test(token.text) || /^ +$/.test(token.text)) {
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
      startIndex: spaceToken.text.length,
      endIndex: token.endIndex,
      offset: token.offset + spaceToken.text.length,
      scopes: token.scopes,
      text: token.text.substring(spaceToken.text.length),
    },
  ];
}

function getClass(token: Token) {
  const valText = token.text.trim();

  if (valText.length === 0) {
    return;
  }

  return token.scopes
    .filter((item) => item !== 'source.ts')
    .map((item) => `lsp-${item.replace(/\.ts/, '').replace(/\./g, '-')}`)
    .join(' ');
}

function getInfo(server: TsServer, token: Token) {
  const innerText = token.text.trim();

  if (innerText.length === 0 || noInfoChar[innerText]) {
    return;
  }

  const tokenScope = token.scopes.join(' ');

  // 跳过 import 语句
  if (tokenScope.includes('meta.import.ts') && tokenScope.includes('string.quoted')) {
    return;
  }

  const info = server.getQuickInfoAtPosition(token.offset);

  if (!info) {
    return;
  }

  return info;
}

export const ready: Promise<void> = getGrammar().then(() => void 0);

export function tokenize(code: string, lang: ScriptKind = 'ts', platform: Platform = 'browser') {
  const server = getTsServer(lang, platform);
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
        .map((token) =>
          lineStartTokenSplit({
            ...token,
            offset: token.startIndex + offset,
            text: line.substring(token.startIndex, token.endIndex),
          }),
        )
        .reduce((ans, token) => ans.concat(token), [])
        .map((token) => ({
          ...token,
          class: getClass(token),
          info: getInfo(server, token),
        })),
    );

    offset += line.length + 1;
    ruleStack = lineTokens.ruleStack;
  }

  return linesToken;
}
