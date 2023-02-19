import type ts from 'typescript';
import path from 'path';

import { unique } from '@xiao-ai/utils';
import { FileMemory } from './files';
import { ModuleResolutionMemory } from './resolution';
import { TypeScriptConfig, TypeCheckerOptions } from '../types';
import { requireTs } from './utils';

// import {
//   LynxCommonTypeModule,
//   LynxBuildInComponentModule,
//   renderHelperModule,
//   globalTypesModule,
//   windowGlobalTypesModule,
//   tsGlobalTypesModule,
// } from '@byted-lynx/transformer-ttml';

// const Modules = [
//   LynxCommonTypeModule,
//   LynxBuildInComponentModule,
//   renderHelperModule,
//   globalTypesModule,
//   windowGlobalTypesModule,
//   tsGlobalTypesModule,
// ];

// const ConstantModule = toMap(
//   Modules,
//   (item) => item.import,
//   (item) => ({ resolvedFileName: item.path }),
// );

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

  /** 编译命令 */
  // private parsedConfig: ts.ParsedCommandLine;

  /** js/ts 语言服务 */
  private jsLanguageService: ts.LanguageService;

  /** 编译选项 */
  private tsConfigData: TypeScriptConfig = {
    compilerOptions: {},
    include: [],
    exclude: [],
  };

  /** 项目版本号 */
  constructor(basePath: string, opt: TypeCheckerOptions) {
    this.basePath = basePath;
    this.tsModule = requireTs(opt.typescriptPath);

    const { tsModule } = this;
    const jsHost = this.createLanguageServiceHost();
    const registry = tsModule.createDocumentRegistry(true);

    this.jsLanguageService = tsModule.createLanguageService(jsHost, registry);
    this.getParsedCommand(opt.configFile);
  }

  /** 获取编译选项 */
  private getParsedCommand(configFile?: string) {
    const { basePath, tsModule, files } = this;
    const tsconfigPath =
      configFile && path.isAbsolute(configFile)
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
      lib: ['ESNext', 'DOM'],
      skipLibCheck: true,
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

          // TODO: 常量模块

          const { resolvedModule } = tsModule.resolveModuleName(
            name,
            containingFile,
            compilerOptions,
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
        // /**
        //  * 某些特殊情况下 typescript 的类型文件传入的名称是错误的
        //  * 暂且不知道为什么会传入错误的名称，总之这里将会强制修正 ts 的自带库路径
        //  */
        // if (/node_modules[\\/]typescript/.test(fileName)) {
        //   const name = path.basename(fileName);
        //   const dir = path.dirname(fileName);

        //   if (!name.endsWith('.d.ts')) {
        //     fileName = path.join(dir, `lib.${name.toLowerCase()}.d.ts`);
        //   }
        // }

        debugger;
        if (this.files.has(fileName)) {
          return this.files.get(fileName)!.snapshot;
        }

        const fileText = this.tsModule.sys.readFile(fileName);

        if (fileText) {
          this.files.setScript(fileName, fileText);
          return this.files.get(fileName)!.snapshot;
        }
      },
    };
  }

  /** 文件变更 */
  filesChanged(...files: string[]) {
    // TODO: 过滤 md 文件
    // tsconfig.json 文件变更单独列出
  }

  getDiagnostics() {
    const program = this.jsLanguageService.getProgram();
    const rawScriptDiagnostics = [
      ...(program?.getSyntacticDiagnostics() ?? []),
      ...(program?.getSemanticDiagnostics() ?? []),
      ...(program?.getDeclarationDiagnostics() ?? []),
      // ...this.jsLanguageService.getSuggestionDiagnostics(),
    ];

    debugger;
    return [];
  }

  dispose() {
    // TODO:
    this.jsLanguageService.dispose();
  }
}
