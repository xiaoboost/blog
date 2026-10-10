/** 命名导入、导出超过阈值或已采用多行格式时，每项独占一行。 */
export default {
  meta: {
    type: 'layout',
    docs: { description: '命名导入与导出逐项换行' },
    fixable: 'whitespace',
    defaultOptions: [{ minSpecifiers: 4 }],
    schema: [
      {
        type: 'object',
        properties: {
          minSpecifiers: { type: 'integer', minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      specifierOnNewline: '多行命名导入与导出中的每一项必须独占一行。',
    },
  },
  create(context) {
    const minSpecifiers = context.options[0]?.minSpecifiers ?? 4;
    const sourceCode = context.sourceCode;

    function check(node) {
      const specifiers = node.specifiers.filter((specifier) => (
        specifier.type === 'ImportSpecifier' || specifier.type === 'ExportSpecifier'
      ));

      if (specifiers.length === 0) {
        return;
      }

      const openBrace = sourceCode.getTokenBefore(specifiers[0]);
      const afterLast = sourceCode.getTokenAfter(specifiers.at(-1));
      const closeBrace = afterLast.value === ',' ? sourceCode.getTokenAfter(afterLast) : afterLast;

      if (
        specifiers.length < minSpecifiers
        && openBrace.loc.end.line === closeBrace.loc.start.line
      ) {
        return;
      }

      for (let index = 1; index < specifiers.length; index++) {
        const previous = sourceCode.getLastToken(specifiers[index - 1]);
        const current = sourceCode.getFirstToken(specifiers[index]);

        if (previous.loc.end.line !== current.loc.start.line) {
          continue;
        }

        context.report({
          node: specifiers[index],
          messageId: 'specifierOnNewline',
          fix(fixer) {
            const comma = sourceCode.getTokenBefore(current);
            const range = [comma.range[1], current.range[0]];

            // 保留两项之间的注释，只在当前项前插入换行。
            if (sourceCode.text.slice(...range).trim()) {
              return fixer.insertTextBefore(current, '\n');
            }

            return fixer.replaceTextRange(range, '\n');
          },
        });
      }
    }

    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
    };
  },
};
