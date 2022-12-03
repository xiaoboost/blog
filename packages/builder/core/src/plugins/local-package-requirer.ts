import type { BuilderPlugin } from '@blog/types';

import { dirname, isAbsolute } from 'path';
import { builtinModules } from 'module';
import { normalize } from '@blog/node';

const pluginName = 'local-package';
const requireSuffix = 'require';
const moduleSuffix = 'local-module';
const namespace = 'local-package';

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

function parsePathFromModulePath(path: string) {
  const matcher = new RegExp(`^([\\d\\D]+)\\_([^_]+)\\_${moduleSuffix}$`);
  const result = matcher.exec(path);

  if (!result) {
    throw new Error(`路径解析错误：${path}`);
  }

  return [result[1], result[2]] as const;
}

function parsePathFromRequirePath(path: string) {
  const matcher = new RegExp(`^([\\d\\D]+)\\_${requireSuffix}$`);
  const result = matcher.exec(path);

  if (!result) {
    throw new Error(`路径解析错误：${path}`);
  }

  return result[1];
}

export const LocalPackageRequirer = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const requireSuffixMatcher = new RegExp(`\\_${requireSuffix}$`);
    const moduleSuffixMatcher = new RegExp(`\\_${moduleSuffix}$`);

    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.resolve.tap(pluginName, (args) => {
        if (args.namespace === namespace) {
          if (requireSuffixMatcher.test(args.path)) {
            return {
              path: args.path,
              namespace,
            };
          }
        } else if (isExternal(args.path)) {
          return {
            path: `${normalize(args.importer)}_${args.path}_${moduleSuffix}`,
            namespace,
          };
        }
      });

      bundler.hooks.load.tap(pluginName, (args) => {
        if (args.namespace !== namespace) {
          return;
        }

        if (requireSuffixMatcher.test(args.path)) {
          const file = parsePathFromRequirePath(args.path);
          return {
            resolveDir: dirname(file),
            loader: 'ts',
            contents: `
import { createRequire } from "module";
export default createRequire("${file}");
            `.trim(),
          };
        } else if (moduleSuffixMatcher.test(args.path)) {
          const [file, moduleName] = parsePathFromModulePath(args.path);
          return {
            resolveDir: dirname(file),
            loader: 'ts',
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
