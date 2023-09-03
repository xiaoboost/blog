import type * as ts from 'typescript';

export function getScriptSnapshot(code: string): ts.IScriptSnapshot {
  return {
    getText: (start, end) => code.substring(start, end),
    getLength: () => code.length,
    getChangeRange: () => void 0,
  };
}

export function requireTs(typescriptPath?: string): typeof ts {
  try {
    if (typescriptPath) {
      return require(typescriptPath);
    }
  } catch (_) {
    // ..
  }

  return require('typescript');
}
