import { Fixer } from '@blog/shared';
import type { Mdx } from '@blog/types';
import { visit } from '../ast/walk';

/** 只替换语法树中的公式，保留代码、MDX 表达式和其他原文。 */
export function replaceMath(content: string, ast: Mdx.Root) {
  const fixer = new Fixer(content);
  const imports = new Map<string, string>();

  visit(ast, (node) => {
    if (node.type !== 'math' && node.type !== 'inlineMath') {
      return;
    }

    const component = node.type === 'math' ? 'MathBlock' : 'MathInline';
    let localName = imports.get(component);

    if (!localName) {
      localName = `Blog${component}`;
      // 避免与文章手写的导入或变量重名。
      while (content.includes(localName)) {
        localName += '_';
      }
      imports.set(component, localName);
    }

    fixer.fix({
      start: node.position!.start.offset!,
      end: node.position!.end.offset!,
      newText: `<${localName}>{${JSON.stringify(node.value)}}</${localName}>`,
    });
  });

  if (imports.size === 0) {
    return content;
  }

  // 在替换之后添加导入，避免与位于 offset 0 的公式替换重叠。
  const names = Array.from(imports, ([name, localName]) => `${name} as ${localName}`);
  return `import { ${names.join(', ')} } from '@blog/mdx-katex';\n\n${fixer.apply()}`;
}
