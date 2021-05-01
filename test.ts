import * as ts from 'typescript';
function resolveModuleNames (
  moduleNames: string[],
  containingFile: string,
  reusedNames?: string[],
  redirectedReference?: ts.ResolvedProjectReference,
  options?: ts.CompilerOptions,
): (ts.ResolvedModule | undefined)[] {
  return moduleNames.map((name) => {
    return ts.resolveModuleName(
      name,
      containingFile,
      options,
      ts.sys,
    ).resolvedModule;
  });
}