import type ts from 'typescript';
import path from 'path';

export function createTypeCheckerReporter({
  typescriptPath,
  configPath,
}: {
  typescriptPath: string;
  configPath: string;
}) {
  try {
    require.resolve(typescriptPath);
  } catch (e) {
    throw new Error('you must install `typescript` with type check enabled');
  }

  const typescript: typeof ts = require(typescriptPath);

  const formatHost: ts.FormatDiagnosticsHost = {
    getCanonicalFileName: (path) => path,
    getCurrentDirectory: typescript.sys.getCurrentDirectory,
    getNewLine: () => typescript.sys.newLine,
  };

  if (!configPath) {
    return;
  }

  const configFilePath = path.isAbsolute(configPath)
    ? configPath
    : path.join(process.cwd(), configPath);

  const createProgram = typescript.createSemanticDiagnosticsBuilderProgram;
  const config = typescript.readJsonConfigFile(configPath, typescript.sys.readFile);
  const content = typescript.parseJsonSourceFileConfigFileContent(
    config,
    typescript.sys,
    path.dirname(configFilePath),
    {},
    path.basename(configFilePath),
  );

  const host = typescript.createWatchCompilerHost(
    content.fileNames,
    {
      ...content.options,
      noEmit: true,
    },
    {
      ...typescript.sys,
      getExecutingFilePath: () => typescriptPath,
    },
    createProgram,
    reportDiagnostic,
    reportWatchStatusChanged,
  );

  const program = typescript.createWatchProgram(host);

  function reportDiagnostic(diagnostic: ts.Diagnostic) {
    if (!diagnostic.file) {
      return;
    }

    console.log(
      typescript.formatDiagnosticsWithColorAndContext([diagnostic], formatHost) +
        formatHost.getNewLine(),
    );
  }
  function reportWatchStatusChanged(diagnostic: ts.Diagnostic) {
    // custom log when compilation end
    if (diagnostic.code === 6194) {
      console.info(`${diagnostic.messageText}`);
    }
  }

  return {
    program,
  };
}
