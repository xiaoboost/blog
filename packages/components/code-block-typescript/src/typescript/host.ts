import ts from 'typescript';
import path from 'path';

import { toBoolMap, isString } from '@xiao-ai/utils';
import { lookItUpSync } from 'look-it-up';

export type ScriptKind = 'ts' | 'tsx';
export type Platform = 'browser' | 'node' | 'none';
export type DisplaySymbol = string | [string, string];

/** 全局缓存名称 */
const globalCacheKey = 'TsServer';
/** 语言服务器缓存 */
const serverCache: Record<string, TsServer> = getGlobalVar(globalCacheKey) ?? {};
/** 公共静态文件缓存 */
const cache: Record<string, CodeFile> = {};
/** 项目根目录 */
const modulesPath = lookItUpSync('node_modules', __dirname);

if (!getGlobalVar(globalCacheKey)) {
  setGlobalVar(globalCacheKey, serverCache);
}

if (!modulesPath) {
  throw new Error(`未找到包含 node_modules 目录的上级路径，起始路径为：${__dirname}`);
}

/**
 * 读取绝对路径
 *   - 路径是相对于 builder 库根目录的
 */
const resolve = (...paths: string[]) => path.join(modulesPath, '..', ...paths);

/** 代码文件 */
interface CodeFile {
  name: string;
  code: string;
  version: number;
  snapshot: ts.IScriptSnapshot;
}

/** 不需要样式的数据类型 */
const infoNoStyleKinds = toBoolMap(['space', 'text', 'lineBreak', 'punctuation']);

function displayPartsToString(tokens: ts.SymbolDisplayPart[]) {
  const result: DisplaySymbol[] = [];

  for (const token of tokens) {
    if (infoNoStyleKinds[token.kind]) {
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

/** 语言服务器 */
export class TsServer {
  /** script 类型 */
  private readonly scriptKind: ScriptKind;

  /** 平台类型 */
  private readonly platform: Platform;

  /** 语言服务器 */
  private readonly server: ts.LanguageService;

  /** 包含的静态文件 */
  private readonly files = new Set<string>();

  /** 当前文件 */
  private current!: CodeFile;

  /** 当前项目版本 */
  private version = 0;

  constructor(scriptKind: ScriptKind, platform: Platform = 'browser') {
    this.scriptKind = scriptKind;
    this.platform = platform;
    this.setFile('');
    this.server = ts.createLanguageService(this.createLanguageServiceHost());
  }

  private getScriptSnapshot(code: string): ts.IScriptSnapshot {
    return {
      getText: (start, end) => code.substring(start, end),
      getLength: () => code.length,
      getChangeRange: () => void 0,
    };
  }

  private getCurrentName() {
    return path.join(resolve(), `_template.${this.scriptKind}`);
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
        if (this.current && filePath === this.current.name) {
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
      getCurrentDirectory: () => resolve(),
      useCaseSensitiveFileNames: () => true,
    };
  }

  setFile(code: string) {
    const name = this.getCurrentName();

    if (this.current && code === this.current.code) {
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

export function getTsServer(kind: ScriptKind, platform: Platform) {
  const key = `${kind}-${platform}`;

  if (serverCache[key]) {
    return serverCache[key];
  } else {
    const server = new TsServer(kind, platform);
    serverCache[key] = server;
    return server;
  }
}
