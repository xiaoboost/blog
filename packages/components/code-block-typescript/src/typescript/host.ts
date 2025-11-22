import ts from 'typescript';

import { normalize } from '@blog/node';
import { toBoolMap, isString } from '@xiao-ai/utils';
import { getAccessor } from '@blog/context/runtime';

export type ScriptKind = 'ts' | 'tsx' | 'js' | 'jsx';
export type Platform = 'browser' | 'node' | 'none';
export type DisplaySymbol = string | [string, string];

let id = 0;

/** 公共静态文档缓存 */
const tsDocument = getAccessor('ts-document', ts.createDocumentRegistry()).get();
/** 公共静态文件缓存 */
const fileCache = getAccessor<Record<string, CodeFile>>('ts-file-cache', {}).get();

/** 代码文件 */
interface CodeFile {
  name: string;
  code: string;
  snapshot: ts.IScriptSnapshot;
}

/** 错误信息 */
export interface DiagnosticData {
  // /** 错误信息 */
  // category: keyof typeof ts.DiagnosticCategory;
  /** 错误信息 */
  messages: string[];
  /** 错误编码 */
  code: number;
  /** 错误 Token 在代码中的偏移量 */
  offset: number;
  /** 错误 Token 的长度 */
  length: number;
}

/** 不需要样式的数据类型 */
const infoNoStyleKinds = toBoolMap(['space', 'text', 'lineBreak', 'punctuation']);

/** 语言服务器 */
export class TsServer {
  /** 全局导出代码缓存 */
  static ExportCode = new Map<string, string>();

  /** script 类型 */
  private scriptKind: ScriptKind = 'ts';

  /** 平台类型 */
  private platform: Platform = 'none';

  /** 语言服务器 */
  private readonly server: ts.LanguageService;

  /** 包含的静态文件 */
  private readonly files = new Set<string>();

  /** 当前文件 */
  private current!: CodeFile;

  /** 基础路径 */
  private readonly baseDir: string;

  constructor(baseDir: string, code: string, scriptKind: ScriptKind, platform: Platform) {
    this.baseDir = baseDir;
    this.scriptKind = scriptKind;
    this.platform = platform;
    this.current = {
      code: `${code}\n\n\n export {};\n`,
      // 文件名称必须要不同，Document 服务会记录同名文件
      name: this.resolve(`$index-${Date.now()}-${id++}.${this.scriptKind}`),
      snapshot: this.getScriptSnapshot(code),
    };
    this.files.add(this.current.name);
    this.server = ts.createLanguageService(this.createLanguageServiceHost(), tsDocument);
  }

  private getScriptSnapshot(code: string): ts.IScriptSnapshot {
    return {
      getText: (start, end) => code.substring(start, end),
      getLength: () => code.length,
      getChangeRange: () => void 0,
    };
  }

  private resolve(...paths: (string | number)[]) {
    return normalize(this.baseDir, ...paths.map(String));
  }

  private getAllFileNames() {
    return Array.from(this.files.keys());
  }

  private createLanguageServiceHost(): ts.LanguageServiceHost {
    return {
      readFile: ts.sys.readFile,
      fileExists: ts.sys.fileExists,
      getDefaultLibFileName: ts.getDefaultLibFilePath,
      getCompilationSettings: (): ts.CompilerOptions => {
        const allowJs = this.scriptKind.startsWith('js');
        const isJsx = this.scriptKind.endsWith('x');
        const jsx = isJsx ? ts.JsxEmit.React : ts.JsxEmit.None;
        const jsxFactory = isJsx ? 'React' : undefined;
        const lib = this.platform === 'browser' || isJsx ? ['lib.dom.d.ts'] : [];
        const types = this.platform === 'node' ? ['node'] : [];

        lib.push('lib.esnext.d.ts');

        if (isJsx) {
          types.push('react');
        }

        return {
          strict: false,
          allowJs,
          jsx,
          jsxFactory,
          allowSyntheticDefaultImports: true,
          allowNonTsExtensions: true,
          target: ts.ScriptTarget.Latest,
          moduleResolution: ts.ModuleResolutionKind.NodeJs,
          module: ts.ModuleKind.ESNext,
          lib,
          types,
        };
      },
      getScriptFileNames: () => {
        return this.getAllFileNames();
      },
      getProjectVersion: () => {
        return '0';
      },
      getScriptVersion: () => {
        return '0';
      },
      getScriptSnapshot: (filePath) => {
        if (filePath === this.current.name) {
          return this.current.snapshot;
        } else if (fileCache[filePath]) {
          this.files.add(filePath);
          return fileCache[filePath].snapshot;
        } else {
          const fileText = TsServer.ExportCode.has(filePath)
            ? TsServer.ExportCode.get(filePath) ?? ''
            : ts.sys.readFile(filePath) ?? '';

          const file: CodeFile = {
            name: filePath,
            code: fileText,
            snapshot: this.getScriptSnapshot(fileText),
          };

          this.files.add(filePath);
          fileCache[filePath] = file;

          return file.snapshot;
        }
      },
      resolveModuleNames: (
        moduleNames,
        containingFile,
        _1,
        _2,
        options,
      ): (ts.ResolvedModule | undefined)[] => {
        return moduleNames.map((name) => {
          // 内置缓存模块返回其本身即可
          if (TsServer.ExportCode.has(name)) {
            return {
              extension: '.ts',
              resolvedFileName: name,
              packageName: name,
            };
          }

          return ts.resolveModuleName(name, containingFile, options, ts.sys).resolvedModule;
        });
      },
      getNewLine: () => '\n',
      getCurrentDirectory: () => this.resolve(),
      useCaseSensitiveFileNames: () => true,
    };
  }

  getQuickInfoAtPosition(offset: number) {
    const infos = this.server.getQuickInfoAtPosition(this.current.name, offset);

    if (!infos || !infos.displayParts) {
      return '';
    }

    const result: DisplaySymbol[] = [];

    for (const token of infos.displayParts ?? []) {
      // 有些文本会包含基础路径，需要去除掉
      if (token.text.includes(this.baseDir)) {
        token.text = token.text.replace(this.baseDir, '.');
      }

      if (infoNoStyleKinds[token.kind as keyof typeof infoNoStyleKinds]) {
        const lastText = result[result.length - 1];

        if (isString(lastText)) {
          result.splice(result.length - 1, 1, lastText + token.text);
        } else {
          result.push(token.text);
        }
      } else {
        result.push([token.kind, token.text]);
      }
    }

    return encodeURI(JSON.stringify(result));
  }

  getDiagnostics() {
    const program = this.server.getProgram();
    const sourceFile = program?.getSourceFile(this.current.name);
    const rawScriptDiagnostics = [
      ...(program?.getSyntacticDiagnostics(sourceFile) ?? []),
      ...(program?.getSemanticDiagnostics(sourceFile) ?? []),
      ...(program?.getDeclarationDiagnostics(sourceFile) ?? []),
    ];

    const host: ts.FormatDiagnosticsHost = {
      getCurrentDirectory: () => this.resolve(),
      getCanonicalFileName: () => '',
      getNewLine: () => '\n',
    };

    const formatDiagnostic = (diagnostic: ts.Diagnostic) => {
      const tsFormatted = ts.formatDiagnostic(diagnostic, host);
      return tsFormatted
        .replace(/^[\d\D]+?error TS\d+:/, '')
        .trim()
        .split('\n');
    };

    return rawScriptDiagnostics
      .filter(
        (diagnostic) => diagnostic.start && diagnostic.category === ts.DiagnosticCategory.Error,
      )
      .map((diagnostic): DiagnosticData => {
        return {
          messages: formatDiagnostic(diagnostic),
          code: diagnostic.code,
          offset: diagnostic.start!,
          length: diagnostic.length ?? -1,
        };
      });
  }
}
