import { parseQuery } from '@blog/node';
import type { ScriptKind, Platform } from './typescript/host';

const scriptKinds: Partial<Record<string, ScriptKind>> = {
  ts: 'ts',
  typescript: 'ts',
  tsx: 'tsx',
  js: 'js',
  javascript: 'js',
  jsx: 'jsx',
};

function booleanOption(value: unknown): boolean | undefined {
  return value === undefined ? undefined : value === true || value === 'true' || value === '';
}

/** 渲染和依赖扫描共用的配置：代码块参数优先于文章配置，全站默认关闭 LSP。 */
export function resolveCodeBlockOptions(
  language: string,
  options: Record<string, unknown> = {},
  articleLsp = false,
) {
  const name = language.trim().toLowerCase();
  const scriptKind = scriptKinds[name];
  const platform: Platform = options.platform === 'browser' || options.platform === 'node'
    ? options.platform
    : 'none';

  return {
    lang: scriptKind ?? name,
    scriptKind,
    enableLsp: Boolean(scriptKind) && (booleanOption(options.lsp) ?? articleLsp),
    showError: booleanOption(options.showError) ?? true,
    visible: booleanOption(options.visible) ?? true,
    platform,
    exportAs: typeof options.exportAs === 'string' ? options.exportAs : undefined,
  };
}

/** 同时接受 Markdown 语言标记和渲染后的 language-* 类名。 */
export function parseCodeBlockInfo(info = '', articleLsp = false) {
  const { base, query } = parseQuery(info.replace(/^language-/, ''));
  return resolveCodeBlockOptions(base, query, articleLsp);
}
