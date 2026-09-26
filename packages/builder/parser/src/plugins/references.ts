import type { Mdx } from '@blog/types';
import { visit } from '../ast/walk';

type RefNode = Mdx.MdxJsxFlowElement | Mdx.MdxJsxTextElement;
type Source = { id?: string; title?: string; href?: string; note?: string };

function readSource(node: RefNode): Source {
  const source: Source = {};
  for (const attr of node.attributes) {
    if (attr.type !== 'mdxJsxAttribute'
      || ![
        'id', 'title', 'href', 'note',
      ].includes(attr.name)
      || typeof attr.value !== 'string') {
      throw new Error('Ref 只接受 id、title、href、note 四个静态字符串属性。');
    }
    source[attr.name as keyof Source] = attr.value.trim();
  }
  if (node.children.some((child) => child.type !== 'text' || child.value.trim())) {
    throw new Error('Ref 请使用自闭合标签，补充说明写在 note 属性中。');
  }
  if (!source.title && !source.id) {
    throw new Error('Ref 需要 title；复用已有资料时可以只写 id。');
  }
  return source;
}

/** 将行内资料声明交给 GFM 脚注系统统一编号、汇总并生成返回链接。 */
export function remarkReferences() {
  return (tree: Mdx.Root) => {
    const sources = new Map<string, Source>();
    const identifiers = new Set<string>();
    const entries: { node: RefNode; source: Source; key: string }[] = [];

    visit(tree, (node) => {
      if (node.type === 'footnoteDefinition') {
        identifiers.add(node.identifier);
      }
      if ((node.type !== 'mdxJsxTextElement' && node.type !== 'mdxJsxFlowElement')
        || node.name !== 'Ref') {
        return;
      }
      const source = readSource(node);
      const key = source.id
        ? `id:${source.id}`
        : JSON.stringify([
          source.title, source.href, source.note,
        ]);
      entries.push({ node, source, key });
      if (source.title) {
        const previous = sources.get(key);
        if (previous && (previous.title !== source.title
          || previous.href !== source.href || previous.note !== source.note)) {
          throw new Error(`Ref 的 id「${source.id}」对应了不同的资料。`);
        }
        sources.set(key, source);
      }
    });

    const definitions = new Map<string, Mdx.FootnoteDefinition>();
    const replacements = new Map<RefNode, Mdx.FootnoteReference>();
    for (const { node, key, source: usage } of entries) {
      const source = sources.get(key);
      if (!source) {
        throw new Error(`Ref「${usage.id}」没有完整的资料声明。`);
      }
      let definition = definitions.get(key);
      if (!definition) {
        let identifier = `blog-ref-${definitions.size + 1}`;
        while (identifiers.has(identifier)) {
          identifier += '-';
        }
        identifiers.add(identifier);
        const title: Mdx.Text = { type: 'text', value: source.title! };
        const children: Mdx.PhrasingContent[] = [
          source.href
            ? { type: 'link', url: source.href, children: [title] }
            : title,
        ];
        if (source.note) {
          children.push({ type: 'text', value: `，${source.note}` });
        }
        definition = {
          type: 'footnoteDefinition', identifier,
          children: [{ type: 'paragraph', children }],
        };
        definitions.set(key, definition);
      }
      replacements.set(node, { type: 'footnoteReference', identifier: definition.identifier });
    }

    function replace(parent: Mdx.Parent) {
      parent.children.forEach((node, index) => {
        const reference = replacements.get(node as RefNode);
        if (reference) {
          parent.children[index] = node.type === 'mdxJsxFlowElement'
            ? { type: 'paragraph', children: [reference] }
            : reference;
        }
        else if ('children' in node) {
          replace(node);
        }
      });
    }
    replace(tree);
    tree.children.push(...definitions.values());
  };
}
