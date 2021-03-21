import * as ts from 'typescript';

interface CodeFile {
  name: string;
  code: string;
  version: number;
}

const files: CodeFile[] = [];

let projectVersion = 0;

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
    return files.map((file) => file.name);
  },
  getProjectVersion() {
    return String(projectVersion);
  },
  getScriptVersion(fileName) {
    return String(files.find((file) => file.name === fileName)?.version ?? '0');
  },
  getScriptSnapshot() {
    // TODO:
    return {} as any;
  },
  getDefaultLibFileName(opt) {
    return ts.getDefaultLibFileName(opt);
  },
  getCurrentDirectory() {
    return process.cwd();
  },
  readFile(fileName) {
    // ..
  },
  fileExists(fileName) {
    // ..
  },
  directoryExists(dirName) {
    // ..
  },
  getDirectories(dirName) {
    // ..
  },
  readDirectory() {
    // ..
  },
  getNewLine() {
    return '\n';
  },
};

export function updateScript(file: CodeFile) {
  projectVersion++;

  const oldFile = files.find((item) => item.name === file.name);

  if (oldFile) {
    if (oldFile.code !== file.code) {
      oldFile.code === file.code;
      oldFile.version++;
    }
  }
  else {
    files.push(file);
  }
}

export function removeScript(fileName: string) {
  projectVersion++;

  const index = files.findIndex((item) => item.name === fileName);

  if (index > -1) {
    files.splice(index, 1);
  }
}

/** 语言服务器 */
export const tsServer = ts.createLanguageService(serverHost);
