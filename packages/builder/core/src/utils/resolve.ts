import {
  CachedInputFileSystem,
  ResolveOptions as EnhancedResolveOptions,
  create,
} from 'enhanced-resolve';
import type { ImportKind } from 'esbuild';
import type { Resolver, ResolveCreatorOptions, ResolveOptions, Query, PathData } from '@blog/types';
import { isUrl } from '@blog/shared';
import fs from 'fs';
import { parse } from 'querystring';
import { dirname, isAbsolute } from 'path';
import { builtinModules } from 'module';
import { BuilderError } from './error';

// TODO: tsconfig-paths 可能需要另外处理

const ErrorCode = 'RESOLVE_FAILED';

export function isCssImport(kind?: ImportKind) {
  return kind === 'import-rule' || kind === 'url-token';
}

export function parsePath(original: string): PathData {
  const [basic, rawQuery] = original.split('?');
  const query = parse(rawQuery ?? '') as Query;

  for (const [key, val] of Object.entries(query)) {
    if (val === '') {
      query[key] = true;
    }
  }

  return {
    original,
    basic,
    query,
    rawQuery,
  };
}

export function createResolver(options: ResolveCreatorOptions): Resolver {
  const resolveCache = new Map<string, string>();
  const externals = builtinModules.concat(options?.external ?? []);
  const resolveOptions: EnhancedResolveOptions = {
    fileSystem: new CachedInputFileSystem(fs, 4000),
    conditionNames: ['import', 'require', 'node'],
    mainFields: ['source', 'module', 'main'],
    ...options,
  };
  const jsResolver = create.sync({
    ...resolveOptions,
    extensions: ['.jsx', '.tsx', '.js', '.ts', '.json'],
    preferRelative: false,
  });
  const cssResolver = create.sync({
    ...resolveOptions,
    extensions: ['.css'],
    preferRelative: true,
  });
  const getResolveDir = (opt?: ResolveOptions) => {
    return opt?.resolveDir ?? (opt?.importer ? dirname(opt.importer) : options.root);
  };
  const isExternal = (request: string) => {
    if (request.startsWith('.') || isAbsolute(request)) {
      return false;
    }

    const pathSplitted = request.split(/[\\/]/);
    const pkgName = request.startsWith('@')
      ? `${pathSplitted[0]}/${pathSplitted[1]}`
      : pathSplitted[0];

    return externals.includes(pkgName);
  };
  const resolver = (request: string, opt?: ResolveOptions) => {
    const cacheKey = `${request}:${opt?.importer}:${opt?.kind}`;

    if (resolveCache.has(cacheKey)) {
      return resolveCache.get(cacheKey)!;
    }

    try {
      const resolveDir = getResolveDir(opt);
      const result = isCssImport(opt?.kind)
        ? cssResolver({}, resolveDir, request)
        : jsResolver({}, resolveDir, request);

      if (!result) {
        throw new BuilderError({
          project: 'Unknown',
          name: ErrorCode,
          message: `Can't resolve '${request}'.`,
        });
      }

      resolveCache.set(cacheKey, result);

      return result;
    } catch (err: any) {
      throw new BuilderError({
        project: 'Unknown',
        name: ErrorCode,
        message: err.message,
      });
    }
  };

  return (request: string, opt?: ResolveOptions) => {
    const { rawQuery } = parsePath(request);

    if (isUrl(request) || isExternal(request)) {
      return {
        path: request,
        external: true,
        suffix: rawQuery,
      };
    }

    return {
      path: resolver(request, opt),
      external: false,
      namespace: 'file',
      suffix: rawQuery,
    };
  };
}
