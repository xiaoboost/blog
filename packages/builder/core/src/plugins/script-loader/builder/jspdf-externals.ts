import type { BuilderPlugin } from '@blog/types';

const pluginName = 'jspdf-externals';
const optionalDependencies = new Set(['html2canvas', 'dompurify', 'canvg']);

/** 博客只使用 jsPDF 的图片导出，不打包 HTML / SVG 转换的可选依赖。 */
export const JsPdfExternals = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.resolve.tap(pluginName, (args) => {
        if (
          args.kind === 'dynamic-import'
          && optionalDependencies.has(args.path)
          && /[/\\]jspdf[/\\]dist[/\\]/.test(args.importer)
        ) {
          return { path: args.path, external: true };
        }
      });
    });
  },
});
