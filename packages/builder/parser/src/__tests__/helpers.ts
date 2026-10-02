import { runInNewContext } from 'vm';
import type { PostExportData } from '@blog/types';
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from 'typescript';
import { transform } from '../post';

export function postSource(content: string, meta = '') {
  return `---\ntitle: 测试\ncreate: 2026-01-01\nupdate: 2026-01-02\n${meta}---\n\n${content}`;
}

/** 执行编译后的模块；只替换外部组件和资源，验证实际导出与渲染结果。 */
export async function compilePost(content: string, meta = '', format = false) {
  const code = await transform(postSource(content, meta), '/test/post.mdx', format);
  const js = transpileModule(code, {
    compilerOptions: {
      module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX, target: ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {} as PostExportData & { default: (props?: object) => unknown };
  const jsx = (type: string | ((props: object) => unknown), props: object): unknown => (
    typeof type === 'function' ? type(props) : { type, props }
  );
  runInNewContext(js, {
    exports,
    require(source: string) {
      if (source.endsWith('/jsx-runtime')) return { jsx, jsxs: jsx, Fragment: 'Fragment' };
      if (source === '@blog/context/runtime') {
        return {
          defineUtils: (assets: string[]) => ({ getAssetNames: () => [...new Set(assets)] }),
        };
      }
      return new Proxy({ utils: { getAssetNames: () => [source] } }, {
        get(target, key) {
          return key === 'utils' ? target.utils : `${source}.${String(key)}`;
        },
      });
    },
  });
  return { code, ...exports };
}
