import ts from 'typescript';
import path from 'path';

import { normalize } from '@blog/node';
import { isString } from '@xiao-ai/utils';

/** 语言服务器 */
export class TsServer {
  /** 语言服务器 */
  private readonly server: ts.LanguageService;

  /** 当前项目版本 */
  private version = 0;

  constructor() {
    this.server = ts.createLanguageService(this.createLanguageServiceHost());
  }

  private getScriptSnapshot(code: string): ts.IScriptSnapshot {
    return {
      getText: (start, end) => code.substring(start, end),
      getLength: () => code.length,
      getChangeRange: () => void 0,
    };
  }

  private getAllFileNames() {
    if (this.current) {
      this.files.add(this.current.name);
    }

    this.files.add(resolve('node_modules/typescript/lib/lib.esnext.d.ts'));

    if (this.scriptKind === 'tsx') {
      this.files.add(resolve('node_modules/@types/react/index.d.ts'));
    }

    if (this.platform === 'node') {
      this.files.add(resolve('node_modules/@types/node/index.d.ts'));
    } else if (this.platform === 'browser') {
      this.files.add(resolve('node_modules/typescript/lib/lib.dom.d.ts'));
    }

    return Array.from(this.files.keys());
  }

  private createLanguageServiceHost(): ts.LanguageServiceHost {
    return {
      readFile: ts.sys.readFile,
      fileExists: ts.sys.fileExists,
      getDefaultLibFileName: ts.getDefaultLibFilePath,
      getCompilationSettings(): ts.CompilerOptions {
        return {
          strict: false,
          allowJs: true,
          jsx: ts.JsxEmit.React,
          allowSyntheticDefaultImports: true,
          allowNonTsExtensions: true,
          target: ts.ScriptTarget.Latest,
          moduleResolution: ts.ModuleResolutionKind.NodeJs,
          module: ts.ModuleKind.ESNext,
          lib: [],
          types: [],
        };
      },
      getScriptFileNames: () => {
        return this.getAllFileNames();
      },
      getProjectVersion: () => {
        return String(this.version);
      },
      getScriptVersion: (filePath) => {
        if (this.current && filePath === this.current.name) {
          return String(this.current.version);
        } else if (cache[filePath]) {
          return String(cache[filePath].version);
        } else {
          return '0';
        }
      },
      getScriptSnapshot: (filePath) => {
        if (filePath === this.current?.name) {
          return this.current.snapshot;
        } else if (cache[filePath]) {
          this.files.add(filePath);
          return cache[filePath].snapshot;
        } else {
          const fileText = ts.sys.readFile(filePath) ?? '';
          const file: CodeFile = {
            name: filePath,
            code: fileText,
            version: 1,
            snapshot: this.getScriptSnapshot(fileText),
          };

          this.files.add(filePath);
          cache[filePath] = file;

          return file.snapshot;
        }
      },
      resolveModuleNames: (
        moduleNames,
        containingFile,
        reusedNames,
        redirectedReference,
        options,
      ): (ts.ResolvedModule | undefined)[] => {
        return moduleNames.map((name) => {
          return ts.resolveModuleName(name, containingFile, options, ts.sys).resolvedModule;
        });
      },
      getNewLine: () => '\n',
      useCaseSensitiveFileNames: () => true,
    };
  }

  addFile(code: string) {
    const name = this.getCurrentName();

    if (code === this.current?.code) {
      return;
    }

    this.version++;
    this.current = {
      name,
      code,
      snapshot: this.getScriptSnapshot(code),
      version: (this.current?.version ?? 0) + 1,
    };
  }

  getQuickInfoAtPosition(offset: number) {
    const infos = this.server.getQuickInfoAtPosition(this.current.name, offset);

    if (!infos || !infos.displayParts) {
      return '';
    }

    return displayPartsToString(infos.displayParts);
  }
}
