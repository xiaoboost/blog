import type { PluginBuild, Plugin } from 'esbuild';
import { builtinModules } from 'module';
import { getExternalPkg } from '../utils';
import { normalize } from '@blog/shared/node';

import * as path from 'path';

const requireSuffix = 'require';
const moduleSuffix = 'local-module';
const namespace = 'local-package';

async function isExternal(path: string) {
  const externals = (await getExternalPkg()).concat(builtinModules);

  // monorepo 和相对路径
  if (path.startsWith('@blog') || path.startsWith('.')) {
    return false;
  }

  // 绝对路径
  if (/^[a-zA-Z]:[\\/]/.test(path)) {
    return false;
  }

  // 特殊库
  if (path.startsWith('@xiao-ai/utils')) {
    return false;
  }

  const [packageName] = path.split('/');
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

export function LocalPackageLoader(): Plugin {
  return {
    name: 'local-package.loader',
    setup(build: PluginBuild) {
      build.onResolve({ filter: /.*/ }, async (args) => {
        if (!(await isExternal(args.path))) {
          return null;
        }

        return {
          path: `${normalize(args.importer)}_${args.path}_${moduleSuffix}`,
          namespace,
        };
      });

      build.onResolve({ filter: new RegExp(`\\_${requireSuffix}$`) }, (args) => {
        return {
          path: args.path,
          namespace,
        };
      });

      build.onLoad({ filter: new RegExp(`\\_${requireSuffix}$`), namespace }, (args) => {
        const file = parsePathFromRequirePath(args.path);
        return {
          resolveDir: path.dirname(file),
          loader: 'ts',
          contents: `
            import { createRequire } from "module";
            export default createRequire("${file}");
          `,
        };
      });

      build.onLoad({ filter: new RegExp(`\\_${moduleSuffix}$`), namespace }, (args) => {
        const [file, moduleName] = parsePathFromModulePath(args.path);

        return {
          resolveDir: path.dirname(file),
          loader: 'ts',
          contents: `
            import localRequire from '${file}_${requireSuffix}';
            export = localRequire('${moduleName}');
          `,
        };
      });
    },
  };
}
