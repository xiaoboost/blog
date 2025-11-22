import * as vsctm from 'vscode-textmate';
import * as oniguruma from 'vscode-oniguruma';

import { readFile } from 'fs/promises';
import { getAccessor, forEach } from '@blog/context/runtime';
import { ScriptKind, Platform, TsServer, DiagnosticData } from './host';
import { ComponentName } from '../constant';

import tsPlistPath from '../../tmLanguage/ts.plist';
import tsxPlistPath from '../../tmLanguage/tsx.plist';
// eslint-disable-next-line import/no-relative-packages
import wasmBinPath from '../../node_modules/vscode-oniguruma/release/onig.wasm';

const tsGrammar = getAccessor<vsctm.IGrammar>('tsGrammar');
const tsxGrammar = getAccessor<vsctm.IGrammar>('tsxGrammar');

export interface Token extends vsctm.IToken {
  /** 距离整个代码开头的偏移 */
  offset: number;
  /** 原始字符串 */
  text: string;
  /** 渲染后的标签类名 */
  className?: string;
  /** 代码提示 */
  info?: string;
  /** 错误信息 */
  diagnostic?: DiagnosticData;
}

async function getGrammar() {
  if (tsGrammar.get() && tsxGrammar.get()) {
    return;
  }

  const wasmContent = await readFile(wasmBinPath);
  const vscodeOnigurumaLib: Promise<vsctm.IOnigLib> = oniguruma.loadWASM(wasmContent).then(() => ({
    createOnigScanner: (source: string[]) => new oniguruma.OnigScanner(source),
    createOnigString: (str: string) => new oniguruma.OnigString(str),
  }));

  const registry = new vsctm.Registry({
    onigLib: vscodeOnigurumaLib,
    loadGrammar: async (scopeName) => {
      if (scopeName === 'source.ts') {
        return vsctm.parseRawGrammar((await readFile(tsPlistPath)).toString('utf-8'));
      } else if (scopeName === 'source.tsx') {
        return vsctm.parseRawGrammar((await readFile(tsxPlistPath)).toString('utf-8'));
      } else {
        throw new Error(`Unknown scopeName: ${scopeName}.`);
      }
    },
  });

  const tsGrammarInstance = await registry.loadGrammar('source.ts');
  const tsxGrammarInstance = await registry.loadGrammar('source.tsx');

  if (!tsGrammarInstance || !tsxGrammarInstance) {
    throw new Error('语法器加载失败');
  }

  tsGrammar.set(tsGrammarInstance);
  tsxGrammar.set(tsxGrammarInstance);
}

/** 不需要获取语法提示的字符 */
const noInfoChar = Array.from('{}:();,+-*/.\'"=[]%`<>|^&~!')
  .concat(['=>', '**', '>>', '<<', '>>>', '&&', '||'])
  .concat(['==', '===', '!=', '!==', '>=', '<=', '++', '--'])
  .concat(['new', 'function'])
  .reduce((ans, item) => ((ans[item] = true), ans), {} as Record<string, boolean>);

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

// 全局钩子
forEach((runtime) => {
  runtime.hooks.beforeStart.tapPromise(ComponentName, () => getGrammar());
});

export function tokenize(
  code: string,
  baseDir: string,
  lang: ScriptKind,
  platform: Platform,
  showError = true,
) {
  const grammar = /^(j|t)s$/.test(lang) ? tsGrammar.get() : tsxGrammar.get();
  const server = new TsServer(baseDir, code, lang, platform);
  const lines = code.split(/[\n\r]/);
  const linesToken: Token[][] = [];
  const diagnostics = showError ? server.getDiagnostics() : [];

  if (!grammar) {
    throw new Error('语法器加载失败');
  }

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
          className: getClass(token),
          info: getInfo(server, token),
          diagnostic: diagnostics.find((data) => data.offset === token.offset),
        })),
    );

    offset += line.length + 1;
    ruleStack = lineTokens.ruleStack;
  }

  return linesToken;
}
