import MarkdownIt from 'markdown-it';

export function ParagraphRender(md: MarkdownIt) {
  md.renderer.rules.softbreak = () => {
  return '<br><span class="softbreak"></span>';
  };
}
