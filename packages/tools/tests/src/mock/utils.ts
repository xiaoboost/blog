import Module from 'module';
import { dirname, join, resolve, sep as pathSep } from 'path';
import normalize from 'normalize-path';

const globalPaths: string[] = (Module as any).globalPaths ?? [];
const originalResolveFileName: (file: string) => string = (Module as any)._resolveFilename;

export function isModuleNotFoundError(e: any) {
  return e.code && e.code === 'MODULE_NOT_FOUND';
}

export function isInNodePath(resolvedPath: string) {
  if (!resolvedPath) {
    return false;
  }

  return globalPaths
    .map((nodePath: string) => resolve(process.cwd(), nodePath) + pathSep)
    .some((fullNodePath: string) => resolvedPath.indexOf(fullNodePath) === 0);
}

export function getFullPath(path: string, calledFrom: string) {
  let resolvedPath = '';

  try {
    resolvedPath = require.resolve(path);
  } catch (e) {
    // do nothing
  }

  const isLocalModule = /^\.{1,2}[/\\]?/.test(path);
  const isInPath = isInNodePath(resolvedPath);
  const isExternal = !isLocalModule && /[/\\]node_modules[/\\]/.test(resolvedPath);
  const isSystemModule = resolvedPath === path;

  if (isExternal || isSystemModule || isInPath) {
    return normalize(resolvedPath);
  }

  if (!isLocalModule) {
    return normalize(path);
  }

  const localModuleName = join(dirname(calledFrom), path);

  try {
    return originalResolveFileName(localModuleName);
  } catch (e) {
    if (isModuleNotFoundError(e)) {
      return normalize(localModuleName);
    } else {
      throw e;
    }
  }
}
