import { builtinModules } from 'module';
import { dirname, isAbsolute } from 'path';
import { normalize } from '@blog/node';
import type { BuilderPlugin } from '@blog/types';
import { isCssImport } from '../utils';

const pluginName = 'local-package';
const requireSuffix = 'require';
const moduleSuffix = 'local-module';

function isExternal(file: string) {
  // monorepo
  if (file.startsWith('@blog')) {
    return false;
  }

  // 相对路径和绝对路径
  if (file.startsWith('.') || isAbsolute(file)) {
    return false;
  }

  // node 内置模块
  if (builtinModules.includes(file)) {
    return false;
  }

  return true;
}

type LocalPackageData =
  | { kind: 'require'; importer: string }
  | { kind: 'module'; importer: string; request: string };

export const LocalPackageRequirer = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.resolve.tap(pluginName, (args) => {
        // 排除 css 引用
        if (isCssImport(args.kind)) {
          return;
        }

        if (args.namespace === pluginName) {
          const data = args.pluginData as LocalPackageData;

          if (data.kind === 'module' && args.path === `${data.importer}_${requireSuffix}`) {
            return {
              path: args.path,
              namespace: pluginName,
              pluginData: { kind: 'require', importer: data.importer } satisfies LocalPackageData,
            };
          }
        }
        else if (isExternal(args.path)) {
          return {
            path: `${normalize(args.importer)}_${args.path}_${moduleSuffix}`,
            namespace: pluginName,
            pluginData: {
              kind: 'module',
              importer: normalize(args.importer),
              request: args.path,
            } satisfies LocalPackageData,
          };
        }
      });

      bundler.hooks.load.tap(pluginName, (args) => {
        if (args.namespace !== pluginName) {
          return;
        }

        const data = args.pluginData as LocalPackageData;
        const file = data.importer;

        if (data.kind === 'require') {
          return {
            resolveDir: dirname(file),
            loader: 'ts',
            pluginData: data,
            contents: `
import { createRequire } from "module";
export default createRequire("${file}");
            `.trim(),
          };
        }
        else {
          const moduleName = data.request;
          return {
            resolveDir: dirname(file),
            loader: 'ts',
            pluginData: data,
            contents: `
import localRequire from '${file}_${requireSuffix}';
export = localRequire('${moduleName}');
          `.trim(),
          };
        }
      });
    });
  },
});
