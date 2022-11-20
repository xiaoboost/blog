import type { BuilderPlugin } from '@blog/types';

import { dirname, isAbsolute } from 'path';
import { builtinModules } from 'module';
import { readFileSync } from 'fs';
import { normalize } from '@blog/node';
import { lookItUpSync } from 'look-it-up';

const pluginName = 'local-package';
const requireSuffix = 'require';
const moduleSuffix = 'local-module';
const namespace = 'local-package';
const externals: string[] = [];

function getExternalPkg() {
  if (externals.length > 0) {
    return externals.slice();
  }

  const packagePath = lookItUpSync('package.json', __dirname) ?? '';
  const content = readFileSync(packagePath, 'utf-8');
  const data = JSON.parse(content);

  externals.push(
    ...Object.keys(data.dependencies)
      .filter((key) => !data.dependencies[key].startsWith('workspace') || key === '@blog/shared')
      .concat(
        Object.keys(data.devDependencies).filter(
          (key) => !data.devDependencies[key].startsWith('workspace'),
        ),
      ),
  );

  return externals.slice();
}

function isExternal(file: string) {
  // monorepo
  if (file.startsWith('@blog')) {
    return false;
  }

  // 相对路径和绝对路径
  if (file.startsWith('.') || isAbsolute(file)) {
    return false;
  }

  // 特殊库
  if (file.startsWith('@xiao-ai/utils')) {
    return false;
  }

  const externals = getExternalPkg().concat(builtinModules);
  const [packageName] = file.split('/');

  return !externals.includes(packageName);
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
        if (!isExternal(args.path)) {
          return;
        }

        if (requireSuffixMatcher.test(args.path) && args.namespace === namespace) {
          return {
            path: args.path,
            namespace,
          };
        }

        return {
          path: `${normalize(args.importer)}_${args.path}_${moduleSuffix}`,
          namespace,
        };
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
            `,
          };
        } else if (moduleSuffixMatcher.test(args.path)) {
          const [file, moduleName] = parsePathFromModulePath(args.path);
          return {
            resolveDir: dirname(file),
            loader: 'ts',
            contents: `
            import localRequire from '${file}_${requireSuffix}';
            export = localRequire('${moduleName}');
          `,
          };
        }
      });
    });
  },
});
