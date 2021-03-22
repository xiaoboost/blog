import ts from 'typescript';
import path from 'path';

/** 代码文件 */
interface CodeFile {
  name: string;
  code: string;
  version: number;
  snapshot: ts.IScriptSnapshot;
}

export type ScriptKind = 'ts' | 'tsx' | 'js' | 'jsx';
export type Platform = 'browser' | 'node';

/** 临时文件 */
const fileName = (ext: ScriptKind) => path.join(process.cwd(), `_template.${ext}`);
const files: Record<string, CodeFile> = {};

let projectVersion = 0;
let current: CodeFile;

function getScriptSnapshot(code: string): ts.IScriptSnapshot {
  return {
    getText: (start, end) => code.substring(start, end),
    getLength: () => code.length,
    getChangeRange: () => void 0,
  }
}

const serverHost: ts.LanguageServiceHost = {
  getCompilationSettings() {
    return {
      strict: true,
      allowJs: true,
      allowSyntheticDefaultImports: true,
      allowNonTsExtensions: true,
      target: ts.ScriptTarget.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      module: ts.ModuleKind.ESNext,
      lib: ['ESNext'],
    };
  },
  getScriptFileNames() {
    return (current ? [current.name] : []).concat(Object.keys(files));
  },
  getProjectVersion() {
    return String(projectVersion);
  },
  getScriptVersion(fileName) {
    if (current && fileName === current.name) {
      return String(current.version);
    }
    else if (files[fileName]) {
      return String(files[fileName].version);
    }
    else {
      return '0';
    }
  },
  getScriptSnapshot(fileName) {
    if (current && fileName === current.name) {
      return current.snapshot;
    }
    else if (files[fileName]) {
      return files[fileName].snapshot;
    }
    else {
      const fileText = ts.sys.readFile(fileName) ?? '';
      const file: CodeFile = {
        name: fileName,
        code: fileText,
        version: 1,
        snapshot: getScriptSnapshot(fileText),
      };

      files[fileName] = file;

      return file.snapshot;
    }
  },
  getDefaultLibFileName(opt) {
    return ts.getDefaultLibFileName(opt);
  },
  getCurrentDirectory() {
    return process.cwd();
  },
  readFile(fileName) {
    debugger;
    return '';
  },
  fileExists(fileName) {
    debugger;
    return false;
  },
  directoryExists(dirName) {
    // 不包含任何库
    if (dirName.endsWith('node_modules/@types')) {
      return false;
    }

    return ts.sys.directoryExists(dirName);
  },
  getDirectories(dirName) {
    return [];
  },
  readDirectory() {
    return [];
  },
  getNewLine() {
    return '\n';
  },
};

export const tsServer = ts.createLanguageService(serverHost);

export function setFile(code: string, kind: ScriptKind = 'ts') {
  const name = fileName(kind);

  if (current) {
    if (code === current.code && name === current.name) {
      return name;
    }
  }
  
  projectVersion++;

  current = {
    code,
    name,
    snapshot: getScriptSnapshot(code),
    version: (current?.version ?? 0) + 1,
  }

  return name;
}

export function getQuickInfoAtPosition(offset: number) {
  const infos = tsServer.getQuickInfoAtPosition(current.name, offset);

  if (!infos || !infos.displayParts) {
    return '';
  }

  return ts.displayPartsToString(infos.displayParts);
}
