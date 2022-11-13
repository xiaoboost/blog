import type { BuilderPlugin } from '@blog/types';
import { dirname } from 'path';
import { normalize } from '@blog/node';

const pluginName = 'local-package-plugin';
const requireSuffix = 'require';
const moduleSuffix = 'local-module';
const namespace = 'local-package';

async function isExternal(file: string) {
  const externals = (await getExternalPkg()).concat(builtinModules);

  // monorepo
  if (file.startsWith('@blog')) {
    return false;
  }

  // 相对路径和绝对路径
  if (file.startsWith('.') || path.isAbsolute(file)) {
    return false;
  }

  // 特殊库
  if (file.startsWith('@xiao-ai/utils')) {
    return false;
  }

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

export const LocalPackagePlugin = (): BuilderPlugin => ({
  name: pluginName,
  apply(builder) {
    const requireSuffixMatcher = new RegExp(`\\_${requireSuffix}$`);
    const moduleSuffixMatcher = new RegExp(`\\_${moduleSuffix}$`);

    builder.hooks.bundler.tap(pluginName, (bundler) => {
      bundler.hooks.resolve.tapPromise(pluginName, async (args) => {
        if (!(await isExternal(args.path))) {
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
        if (args.namespace === namespace) {
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
