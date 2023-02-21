import type ts from 'typescript';
import path from 'path';

import { unique, isString } from '@xiao-ai/utils';
import { FileMemory } from './files';
import { requireTs } from './utils';
import { ModuleResolutionMemory } from './resolution';
import { TypeScriptConfig, TypeCheckerOptions } from '../types';
import { ErrorData } from '../../../utils';

/** 语言服务器 */
export class LanguageService {
  /** 基础路径 */
  private readonly basePath: string;

  /** ts 库依赖 */
  private readonly tsModule: typeof ts;

  /** 数据缓存 */
  private readonly files = new FileMemory();

  /** 模块引入模块缓存 */
  private readonly resolutionCache = new ModuleResolutionMemory();

  /** 项目版本 */
  private projectVersion = 1;

  /** js/ts 语言服务 */
  private jsLanguageService: ts.LanguageService;

  /** 编译选项 */
  private tsConfigData: TypeScriptConfig = {
    compilerOptions: {},
    include: [],
    exclude: [],
  };

  /** 项目版本号 */
  constructor(opt: Required<TypeCheckerOptions>) {
    this.basePath = opt.basePath;
    this.tsModule = requireTs(opt.typescriptPath);

    const { tsModule } = this;
    const jsHost = this.createLanguageServiceHost();
    const registry = tsModule.createDocumentRegistry(true);

    this.jsLanguageService = tsModule.createLanguageService(jsHost, registry);
    this.getParsedCommand(opt.configFile);
    this.runProgram();
  }

  /** 获取编译选项 */
  private getParsedCommand(configFile: string) {
    const { basePath, tsModule, files } = this;
    const tsconfigPath = path.isAbsolute(configFile)
      ? configFile
      : path.join(basePath, configFile ?? 'tsconfig.json');

    const { config } = tsModule.readConfigFile(tsconfigPath, tsModule.sys.readFile);

    this.tsConfigData = {
      ...config,
      include: config.include ?? [],
      exclude: unique(['dist', 'node_modules'].concat(this.tsConfigData.exclude ?? [])),
    };

    const parsedCommand = this.tsModule.parseJsonConfigFileContent(
      this.tsConfigData,
      this.tsModule.sys,
      this.basePath,
      {},
      configFile,
      undefined,
    );

    this.tsConfigData.compilerOptions = parsedCommand.options;

    parsedCommand.fileNames.forEach((file) => {
      const content = tsModule.sys.readFile(file);
      if (content) {
        files.setScript(file, content);
      }
    });
  }

  /** 获取编译选项 */
  private getCompilerOptions(): ts.CompilerOptions {
    return {
      strict: true,
      allowJs: true,
      allowSyntheticDefaultImports: true,
      experimentalDecorators: true,
      ...(this.tsConfigData.compilerOptions ?? {}),

      // 强制设定
      allowNonTsExtensions: true,
      target: this.tsModule.ScriptTarget.Latest,
      moduleResolution: this.tsModule.ModuleResolutionKind.NodeNext,
      module: this.tsModule.ModuleKind.ESNext,
      declaration: false,
      skipDefaultLibCheck: true,
      skipLibCheck: true,
      // locale: 'zh-CN',
    };
  }

  /** 创建内部语言服务器 */
  private createLanguageServiceHost(): ts.LanguageServiceHost {
    return {
      ...this.tsModule.sys,
      getNewLine: () => '\n',
      useCaseSensitiveFileNames: () => true,
      getDefaultLibFileName: this.tsModule.getDefaultLibFileName,
      getProjectVersion: () => this.projectVersion.toString(),
      getCompilationSettings: () => this.getCompilerOptions(),
      getScriptFileNames: () => this.files.getNames(),
      getScriptVersion: (fileName) => {
        if (fileName.includes('node_modules')) {
          return '0';
        }

        return String(this.files.getVersion(fileName));
      },
      getScriptKind: (fileName) => {
        const ext = fileName.substring(fileName.lastIndexOf('.'), Infinity);
        switch (ext.toLowerCase()) {
          case '.js':
          case '.cjs':
          case '.mjs':
            return this.tsModule.ScriptKind.JS;
          case '.jsx':
            return this.tsModule.ScriptKind.JSX;
          case '.ts':
          case '.cts':
          case '.mts':
            return this.tsModule.ScriptKind.TS;
          case '.tsx':
            return this.tsModule.ScriptKind.TSX;
          case '.json':
            return this.tsModule.ScriptKind.JSON;
          default:
            return this.tsModule.ScriptKind.Unknown;
        }
      },
      resolveModuleNames: (moduleNames: string[], containingFile: string) => {
        const { tsModule, resolutionCache } = this;
        const compilerOptions = this.getCompilerOptions();
        return moduleNames.map((name) => {
          const cachedResolvedModule = resolutionCache.getResolution(containingFile, name);

          if (cachedResolvedModule) {
            return cachedResolvedModule;
          }

          // TODO: highlight.js 的错误，待修复
          const resolveOptions =
            name === 'highlight.js'
              ? {
                  ...compilerOptions,
                  moduleResolution: tsModule.ModuleResolutionKind.NodeJs,
                }
              : compilerOptions;

          const { resolvedModule } = tsModule.resolveModuleName(
            name,
            containingFile,
            resolveOptions,
            tsModule.sys,
            undefined,
            undefined,
            tsModule.ModuleKind.CommonJS,
          );

          if (resolvedModule) {
            this.resolutionCache.setResolution(containingFile, name, resolvedModule);
          }

          return resolvedModule;
        });
      },
      getScriptSnapshot: (fileName: string) => {
        const { tsModule, files, basePath, tsConfigData } = this;

        if (files.has(fileName)) {
          return files.get(fileName)!.snapshot;
        }

        const fileRealPath = ((file: string) => {
          if (!/^lib\.\S+\.d\.ts$/.test(file)) {
            return file;
          }

          const libResolved = tsModule.resolveModuleName(
            `typescript/lib/${file.replace('.d.ts', '')}`,
            path.join(basePath, 'index.ts'),
            tsConfigData.compilerOptions,
            tsModule.sys,
            undefined,
            undefined,
            tsModule.ModuleKind.CommonJS,
          );

          if (!libResolved.resolvedModule) {
            return file;
          }

          return libResolved.resolvedModule.resolvedFileName;
        })(fileName);

        const fileText = tsModule.sys.readFile(fileRealPath);

        if (fileText) {
          files.setScript(fileName, fileText);
          return files.get(fileName)!.snapshot;
        }
      },
    };
  }

  /** 运行类型检查 */
  private runProgram() {
    this.jsLanguageService.getProgram();
  }

  /** 文件变更 */
  filesChanged(...fileNames: string[]) {
    const { files, tsModule } = this;

    let change = false;

    for (const file of fileNames) {
      if (/\.mdx?/.test(file)) {
        continue;
      }

      change = true;
      files.setScript(file, tsModule.sys.readFile(file) ?? '');
    }

    if (change) {
      this.projectVersion++;
      this.runProgram();
    }
  }

  getDiagnostics() {
    const program = this.jsLanguageService.getProgram();
    const rawScriptDiagnostics = [
      ...(program?.getSyntacticDiagnostics() ?? []),
      ...(program?.getSemanticDiagnostics() ?? []),
      ...(program?.getDeclarationDiagnostics() ?? []),
    ];

    return rawScriptDiagnostics
      .filter((item) => item.code !== 2742)
      .map(({ code, file, messageText, start, length }): ErrorData => {
        const baseData: ErrorData = {
          name: `TS${code}`,
          project: 'Main',
          message: isString(messageText) ? messageText : messageText.messageText,
        };

        if (!file) {
          return baseData;
        }

        if (!start) {
          return {
            ...baseData,
            filePath: file.fileName,
          };
        }

        const startPosition = file.getLineAndCharacterOfPosition(start);
        const endPosition = file.getLineAndCharacterOfPosition(start + (length ?? 1));

        return {
          ...baseData,
          filePath: file.fileName,
          codeFrame: {
            content: file.getText(),
            range: {
              start: {
                line: startPosition.line + 1,
                column: startPosition.character + 1,
              },
              end: {
                line: endPosition.line + 1,
                column: endPosition.character + 1,
              },
            },
          },
        };
      });
  }

  dispose() {
    this.jsLanguageService.dispose();
  }
}
