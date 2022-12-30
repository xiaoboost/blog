import {
  CachedInputFileSystem,
  ResolverFactory,
  ResolveOptions as EnhancedResolveOptions,
} from 'enhanced-resolve';
import type { Resolver, ResolveCreatorOptions, ResolveOptions, Query, PathData } from '@blog/types';
import fs from 'fs';
import { parse } from 'querystring';
import { dirname, isAbsolute } from 'path';
import { builtinModules } from 'module';
import { BuilderError } from './error';

// TODO: tsconfig-paths 可能需要另外处理

const ErrorCode = 'RESOLVE_FAILED';
const HTTP_PATTERNS = /^(https?:)?\/\//;
const DATAURL_PATTERNS = /^data:/;
const HASH_PATTERNS = /#[^#]+$/;
const isUrl = (source: string) =>
  HTTP_PATTERNS.test(source) || DATAURL_PATTERNS.test(source) || HASH_PATTERNS.test(source);

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
    conditionNames: ['node', 'import', 'module', 'require'],
    mainFields: ['source', 'module', 'main'],
    mainFiles: ['index'],
    ...options,
  };
  const jsResolver = ResolverFactory.createResolver({
    ...resolveOptions,
    extensions: ['.jsx', '.tsx', '.js', '.ts', '.json'],
    preferRelative: false,
  });
  const cssResolver = ResolverFactory.createResolver({
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

    return externals.includes(request);
  };
  const resolver = (request: string, opt?: ResolveOptions) => {
    const cacheKey = `${request}:${opt?.importer}:${opt?.kind}`;

    if (resolveCache.has(cacheKey)) {
      return resolveCache.get(cacheKey)!;
    }

    try {
      const resolveDir = getResolveDir(opt);
      const result =
        opt?.kind === 'import-rule' || opt?.kind === 'url-token'
          ? cssResolver.resolveSync({}, resolveDir, request)
          : jsResolver.resolveSync({}, resolveDir, request);

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
