import { encodeHeadAnchor, getHeadHref } from '../to-content/utils';

/** 文件路径、查询参数和章节锚点分别处理，避免将锚点当成文件名。 */
export function splitPostHref(href: string) {
  const fragmentIndex = href.indexOf('#');
  const fragment = fragmentIndex < 0 ? '' : href.slice(fragmentIndex);
  const location = fragmentIndex < 0 ? href : href.slice(0, fragmentIndex);
  const queryIndex = location.indexOf('?');

  return {
    path: queryIndex < 0 ? location : location.slice(0, queryIndex),
    query: queryIndex < 0 ? '' : location.slice(queryIndex),
    fragment,
  };
}

/** 不完整的百分号编码仍可作为普通链接保留。 */
export function decodeLinkPart(value: string) {
  try {
    return decodeURIComponent(value);
  }
  catch {
    return value;
  }
}

/** 只查找目标文章已有的标题，不消费正文渲染时的标题计数。 */
export function resolveHeadingFragment(
  fragment: string,
  headings: readonly { content: string; hash: string }[],
) {
  if (!fragment || fragment === '#') {
    return fragment;
  }

  const raw = fragment.slice(1);
  const decoded = decodeLinkPart(raw);
  const exact = headings.find((heading) => heading.hash === raw)
    ?? headings.find((heading) => heading.hash === decoded);

  if (exact) {
    return getHeadHref(exact.hash);
  }

  const title = headings.find((heading) => heading.content === raw)
    ?? headings.find((heading) => heading.content === decoded);

  if (title) {
    return getHeadHref(title.hash);
  }

  // MDX 会将中文转为大写百分号编码；正文 ID 沿用小写编码。
  const normalized = encodeHeadAnchor(decoded);
  // 从浏览器复制的地址还会编码 ID 中的百分号，再解码一次以兼容这种地址。
  const decodedId = encodeHeadAnchor(decodeLinkPart(decoded));
  const encoded = headings.find((heading) => heading.hash === normalized)
    ?? headings.find((heading) => heading.hash === decodedId);

  // 未匹配的锚点可能指向作者手写的 HTML ID，保留原值。
  return encoded ? getHeadHref(encoded.hash) : fragment;
}
