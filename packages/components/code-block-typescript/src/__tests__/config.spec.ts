import { expect, describe, it } from '@blog/test-toolkit';
import type { Mdx, PostExportData } from '@blog/types';
import { parseCodeBlockInfo } from '../config';
import { getImportedByPost, getTsCodeBlockConfig } from '../utils';

function code(lang: string): Mdx.Code {
  return { type: 'code', lang, value: "import { value } from 'example-package';" };
}

function post(children: Mdx.RootContent[], lsp = false): PostExportData {
  return { data: { lsp, ast: { type: 'root', children } } } as PostExportData;
}

describe('code block LSP configuration', () => {
  for (const lang of [
    'ts', 'typescript', 'tsx', 'js', 'javascript', 'jsx',
  ]) {
    it(`${lang}: block settings override article settings, with LSP off by default`, () => {
      expect(parseCodeBlockInfo(lang).enableLsp).eq(false);
      expect(parseCodeBlockInfo(lang, true).enableLsp).eq(true);
      expect(parseCodeBlockInfo(`${lang}?lsp=false`, true).enableLsp).eq(false);
      expect(parseCodeBlockInfo(`${lang}?lsp=true`, false).enableLsp).eq(true);
      expect(parseCodeBlockInfo(`${lang}?lsp`, false).enableLsp).eq(true);
    });
  }

  it('keeps unsupported or missing languages as ordinary code', () => {
    expect(parseCodeBlockInfo('json?lsp=true', true).enableLsp).eq(false);
    expect(parseCodeBlockInfo(undefined, true).enableLsp).eq(false);
  });

  it('preserves rendering options and normalizes language aliases', () => {
    expect(parseCodeBlockInfo('language-typescript?lsp=true&platform=node&showError=false&visible=false&exportAs=@@local/helper'))
      .deep.eq({
        lang: 'ts', scriptKind: 'ts', enableLsp: true, platform: 'node',
        showError: false, visible: false, exportAs: '@@local/helper',
      });
  });

  it('scanning and rendering resolve the same fence configuration', () => {
    const lang = 'javascript?lsp=false&platform=browser';
    expect(getTsCodeBlockConfig(code(lang), true)).deep.eq({
      ...parseCodeBlockInfo(`language-${lang}`, true), code: code(lang).value,
    });
  });
});

describe('LSP dependency scanning', () => {
  it('does not collect dependencies from disabled or unsupported blocks', () => {
    expect([...getImportedByPost([post([code('ts'), code('json?lsp=true')])])]).deep.eq([]);
    expect([...getImportedByPost([post([code('ts?lsp=false')], true)])]).deep.eq([]);
  });

  it('collects dependencies from an article opt-in or a block opt-in', () => {
    expect(getImportedByPost([post([code('typescript')], true)]).has('example-package')).eq(true);
    expect(getImportedByPost([post([code('js?lsp=true')])]).has('example-package')).eq(true);
  });

  it('includes nested and hidden definitions when LSP is enabled', () => {
    const nested: Mdx.Blockquote = {
      type: 'blockquote',
      children: [code('ts?lsp=true&visible=false&exportAs=@@local/helper')],
    };
    expect(getImportedByPost([post([nested])]).has('example-package')).eq(true);
  });
});
