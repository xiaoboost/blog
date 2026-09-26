import type styles from './index.jss';

interface Glyph {
  node: Text;
  start: number;
  end: number;
  left: number;
  right: number;
  prefixWidth: number;
}

/** 只让已展开的文字参与行内排版，末尾字形按实际宽度裁切。 */
export function createInlineReveal(description: HTMLElement, classes: typeof styles.classes) {
  const source = description.querySelector<HTMLElement>(`.${classes.glossDescriptionText}`)!;
  const computed = getComputedStyle(description);
  const leading = parseFloat(computed.marginLeft) || 0;
  const padding = parseFloat(computed.paddingRight) || 0;
  const margin = parseFloat(computed.marginRight) || 0;
  const border = parseFloat(computed.borderRightWidth) || 0;
  const trailing = padding + margin + border;
  const originalStyle = description.style.cssText;
  const measure = document.createElement('span');
  const measuredDescription = description.cloneNode(true) as HTMLElement;
  measuredDescription.removeAttribute('id');
  measure.setAttribute('aria-hidden', 'true');
  measure.setAttribute('inert', '');
  measure.classList.add(classes.glossMeasure);
  measure.append(measuredDescription);
  // 字距也受夹注外紧接的标点影响，测量时保留这段行内上下文。
  const following = description.nextSibling || description.parentElement!.nextSibling;
  if (following) measure.append(following.cloneNode(true));
  description.parentElement!.append(measure);

  const measuredSource = measuredDescription.querySelector<HTMLElement>(`.${classes.glossDescriptionText}`)!;
  const measuredWalker = document.createTreeWalker(measuredSource, NodeFilter.SHOW_TEXT);
  const sourceWalker = document.createTreeWalker(source, NodeFilter.SHOW_TEXT);
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  const measureRange = document.createRange();
  measureRange.setStart(measuredSource, 0);
  // 独立前缀的字距可能不同于整句中的前缀，例如连续的中文标点。
  const prefixMeasure = description.cloneNode(false) as HTMLElement;
  prefixMeasure.removeAttribute('id');
  prefixMeasure.style.display = 'inline-block';
  prefixMeasure.style.margin = '0';
  prefixMeasure.style.padding = '0';
  prefixMeasure.style.border = '0';
  measure.append(prefixMeasure);
  const prefixRange = document.createRange();
  prefixRange.setStart(source, 0);
  const glyphs: Glyph[] = [];
  let textWidth = 0;

  for (let node = sourceWalker.nextNode(); node; node = sourceWalker.nextNode()) {
    const measuredNode = measuredWalker.nextNode()!;
    for (const { index, segment } of segmenter.segment(node.textContent || '')) {
      const end = index + segment.length;
      measureRange.setEnd(measuredNode, end);
      const right = measureRange.getBoundingClientRect().width;
      prefixRange.setEnd(node, index);
      prefixMeasure.replaceChildren(prefixRange.cloneContents());
      const prefixWidth = prefixMeasure.getBoundingClientRect().width;
      glyphs.push({ node: node as Text, start: index, end, left: textWidth, right, prefixWidth });
      textWidth = right;
    }
  }
  measure.remove();

  const visual = document.createElement('span');
  visual.className = classes.glossReveal;
  visual.setAttribute('aria-hidden', 'true');
  visual.setAttribute('inert', '');
  description.append(visual);
  const range = document.createRange();
  const total = leading + textWidth + trailing;

  return {
    total,
    render(distance: number) {
      const width = Math.max(0, Math.min(textWidth, distance - leading));
      const tail = trailing ? Math.max(0, distance - leading - textWidth) / trailing : 0;
      description.style.marginLeft = `${Math.min(leading, distance)}px`;
      description.style.paddingRight = `${padding * tail}px`;
      description.style.marginRight = `${margin * tail}px`;
      description.style.borderRightWidth = `${border * tail}px`;

      const next = glyphs.find((glyph) => glyph.right > width);
      range.selectNodeContents(source);
      if (next) range.setEnd(next.node, next.start);
      const content = range.cloneContents();
      if (next && width > 0) {
        // 复制末尾字形的强调、链接等行内格式，字形本身保持原字号。
        let partial: Node = document.createTextNode(next.node.data.slice(next.start, next.end));
        for (
          let parent = next.node.parentElement;
          parent && parent !== source;
          parent = parent.parentElement
        ) {
          const shell = parent.cloneNode(false);
          shell.appendChild(partial);
          partial = shell;
        }
        const clip = document.createElement('span');
        clip.className = classes.glossClip;
        clip.style.width = `${width - next.left}px`;
        // 补回裁切边界拆开的字距，保证动画与完整原文占用相同宽度。
        clip.style.marginLeft = `${next.left - next.prefixWidth}px`;
        clip.append(partial);
        content.append(clip);
      }
      visual.replaceChildren(content);
    },
    dispose() {
      visual.remove();
      description.style.cssText = originalStyle;
    },
  };
}
