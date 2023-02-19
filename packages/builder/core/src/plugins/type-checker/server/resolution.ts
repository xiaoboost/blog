import type * as ts from 'typescript';

export class ModuleResolutionMemory extends Map<string, Map<string, ts.ResolvedModule>> {
  getResolution(module: string, request: string): ts.ResolvedModule | undefined {
    return this.get(module)?.get(request);
  }

  setResolution(module: string, request: string, cache: ts.ResolvedModule) {
    if (!this.has(module)) {
      this.set(module, new Map());
    }

    this.get(module)!.set(request, cache);
  }
}
