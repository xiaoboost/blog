import vsctm from 'vscode-textmate';
import oniguruma from 'vscode-oniguruma';

import { promises as fs } from 'fs';
import { resolveRoot } from '@build/utils';
import { setFile, getQuickInfoAtPosition, ScriptKind } from './host';

let tsGrammar: vsctm.IGrammar;
let tsxGrammar: vsctm.IGrammar;

const noInfoChar: Record<string, boolean> = [
  '{',
  '}',
  ':',
  '(',
  ')',
  ';',
  ',',
  '+',
  '-',
  '*',
  '/',
  '.',
  '\'',
  '"',
].reduce((ans, item) => (ans[item] = true, ans), {});

interface Token extends vsctm.IToken {
  /** 距离整个代码开头的偏移 */
  offset: number;
  /** 原始字符串 */
  text: string;
  /** 渲染后的标签类名 */
  class: string;
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

function renderToken(text: string, scopes: string[]) {
  return '';
}

function getInfo(text: string, offset: number, scopes: string[]) {
  const innerText = text.trim();

  if (innerText.length === 0 || noInfoChar[innerText]) {
    return;
  }

  const info = getQuickInfoAtPosition(offset);

  if (!info) {
    return;
  }

  return info;
}

export async function tokenize(code: string, lang: ScriptKind = 'ts') {
  if (!tsGrammar || !tsxGrammar) {
    await getGrammar();
  }

  setFile(code, lang);

  const grammar = lang === 'ts' ? tsGrammar : tsxGrammar;
  const lines = code.split(/[\n\r]/);
  const linesToken: Token[][] = [];

  let ruleStack = vsctm.INITIAL;
  let offset = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineTokens = grammar.tokenizeLine(line, ruleStack);

    linesToken.push(lineTokens.tokens.map((token) => {
      const text = line.substring(token.startIndex, token.endIndex);
      const indexOffset = token.startIndex + offset;

      return {
        ...token,
        offset: indexOffset,
        class: renderToken(text, token.scopes),
        info: getInfo(text, indexOffset, token.scopes),
        text,
      };
    }));

    offset += line.length + 1;
    ruleStack = lineTokens.ruleStack;
  }

  debugger;
  return linesToken;
}
