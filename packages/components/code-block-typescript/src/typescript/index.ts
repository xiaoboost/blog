import { escape } from 'html-escaper';
import { addSplitLabel } from '@blog/mdx-code-block-normal';
import { v4 as uuid } from 'uuid';
import { tokenize } from './tokenize';
import { lsInfoAttrName, lsErrorTokenAttrName, lsErrorByAttrName } from '../constant';
import { ScriptKind, Platform, DisplaySymbol, DiagnosticData } from './host';
import styles from '../index.jss';

export { ScriptKind, Platform, DisplaySymbol };

enum RenderedTsCodeLineKind {
  Code,
  Error,
}

export interface RenderedTsCodeLine {
  code: string;
  kind: RenderedTsCodeLineKind;
  classNames?: string[];
  indexClassNames?: string[];
  attributes?: Record<string, string>;
  noIndex?: boolean;
}

function renderTsError(diagnostic: DiagnosticData, id: string): RenderedTsCodeLine[] {
  const { code: errCode, messages } = diagnostic;
  const diagnostics = messages.map((text, index, arr) => {
    const classNames = [styles.classes.lspError];
    const indexClassNames: string[] = [];
    const attributes = {
      [lsErrorByAttrName]: id,
    };

    let code = '';

    if (index === 0) {
      classNames.push(styles.classes.lspErrorStartLine);
      indexClassNames.push(styles.classes.lspErrorStartLine);
    }

    if (index === arr.length - 1) {
      classNames.push(styles.classes.lspErrorEndLine);
      indexClassNames.push(styles.classes.lspErrorEndLine);
    }

    if (index === 0) {
      code +=
        `<a class="${styles.classes.lspErrorGoto}" ` +
        `target="_blank" rel="noreferrer" ` +
        `href="https://typescript.tv/errors/#ts${errCode}" ` +
        `title="点击查看错误详细信息">[TS${errCode}]</a> `;
    }

    code += text;

    return {
      code,
      kind: RenderedTsCodeLineKind.Error,
      classNames,
      indexClassNames,
      attributes,
      noIndex: true,
    };
  });

  return diagnostics;
}

function addSplitLabelFromLines(lines: RenderedTsCodeLine[], tabWidth: number) {
  const mapping = new Map<number, number>();
  const codeLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.kind !== RenderedTsCodeLineKind.Code) {
      continue;
    }

    mapping.set(i, codeLines.length);
    codeLines.push(line.code);
  }

  const newLines = addSplitLabel(codeLines, tabWidth);
  const newCodeLines = lines.map((item) => ({ ...item }));

  for (const [originIndex, transformedIndex] of mapping.entries()) {
    newCodeLines[originIndex].code = newLines[transformedIndex];
  }

  return newCodeLines;
}

export function renderTsCode(
  code: string,
  tabWith: number,
  baseDir: string,
  lang: ScriptKind,
  platform: Platform,
  showError: boolean,
) {
  const linesTokens = tokenize(code, baseDir, lang, platform, showError);
  const lineCodes: RenderedTsCodeLine[] = [];

  for (const line of linesTokens) {
    let code = '';
    // 因为可以是多个错误
    const diagnostics: RenderedTsCodeLine[] = [];

    for (const token of line) {
      const { className, diagnostic, info } = token;

      if (className || diagnostic || info) {
        code += '<span';

        if (className) {
          code += ` class="${className}"`;
        }

        if (info) {
          code += ` ${lsInfoAttrName}="${info}"`;
        }

        if (diagnostic) {
          const id = uuid();
          code += ` ${lsErrorTokenAttrName}="${id}"`;
          diagnostics.push(...renderTsError(diagnostic, id));
        }

        code += `>${escape(token.text)}</span>`;
      } else {
        code += escape(token.text);
      }
    }

    lineCodes.push(
      {
        code,
        kind: RenderedTsCodeLineKind.Code,
      },
      ...diagnostics,
    );
  }

  return addSplitLabelFromLines(lineCodes, tabWith);
}
