import ts from 'typescript';
import path from 'path';

import { resolveRoot, toBoolMap, isString } from '@build/utils';

export type ScriptKind = 'ts' | 'tsx';
export type Platform = 'browser' | 'node' | 'none';
export type DisplaySymbol = string | [string, string];

/** 语言服务器缓存 */
const serverCache: Record<string, TsServer> = {};
/** 公共静态文件缓存 */
const cache: Record<string, CodeFile> = {};

/** 代码文件 */
interface CodeFile {
  name: string;
  code: string;
  version: number;
  snapshot: ts.IScriptSnapshot;
}

/** 不需要样式的数据类型 */
const infoNoStyleKinds = toBoolMap(['space', 'text', 'punctuation']);

function displayPartsToString(tokens: ts.SymbolDisplayPart[]) {
  const result: DisplaySymbol[] = [];

  for (const token of tokens) {
    if (infoNoStyleKinds[token.kind]) {
      const lastText = result[result.length - 1];

      if (isString(lastText)) {
        result.splice(result.length - 1, 1, lastText + token.text);
      }
      else {
        result.push(token.text);
      }
    }
    else {
      result.push([token.kind, token.text]);
    }
  }

  return JSON.stringify(result).replace(/"/g, '\'');
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
  private readonly files: Record<string, boolean> = {};
  /** 当前文件 */
  private current!: CodeFile;
  /** 当前项目版本 */
  private version = 0;

  constructor(scriptKind: ScriptKind, platform: Platform = 'none') {
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
    }
  }

  private getCurrentName() {
    return path.join(process.cwd(), `_template.${this.scriptKind}`);
  }

  private getAllFileNames() {
    if (this.current) {
      this.files[this.current.name] = true;
    }

    this.files[resolveRoot('node_modules/typescript/lib/lib.esnext.d.ts')] = true;

    if (this.scriptKind === 'tsx') {
      this.files[resolveRoot('node_modules/@types/react/index.d.ts')] = true;
    }

    if (this.platform === 'node') {
      this.files[resolveRoot('node_modules/@types/node/index.d.ts')] = true;
    }
    else if (this.platform === 'browser') {
      this.files[resolveRoot('node_modules/typescript/lib/lib.dom.d.ts')] = true;
    }

    return Object.keys(this.files);
  }

  private createLanguageServiceHost(): ts.LanguageServiceHost {
    return {
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
        }
        else if (cache[filePath]) {
          return String(cache[filePath].version);
        }
        else {
          return '0';
        }
      },
      getScriptSnapshot: (filePath) => {
        if (this.current && filePath === this.current.name) {
          return this.current.snapshot;
        }
        else if (cache[filePath]) {
          this.files[filePath] = true;
          return cache[filePath].snapshot;
        }
        else {
          const fileText = ts.sys.readFile(filePath) ?? '';
          const file: CodeFile = {
            name: filePath,
            code: fileText,
            version: 1,
            snapshot: this.getScriptSnapshot(fileText),
          };

          this.files[filePath] = true;
          cache[filePath] = file;

          return file.snapshot;
        }
      },
      getNewLine: () => '\n',
      getCurrentDirectory: () => resolveRoot(),
      useCaseSensitiveFileNames: () => true,
      getDefaultLibFileName: ts.getDefaultLibFilePath,
    }
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
  }
  else {
    const server = new TsServer(kind, platform);
    serverCache[key] = server;
    return server;
  }
}
