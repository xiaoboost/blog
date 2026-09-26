const mediaExtension = /\.(?:mp4|webm|mov|m4v|mp3|m4a|aac|ogg|oga|wav|flac|m3u8|mpd)$/i;
const runtimeExtension = /\.(?:jpe?g|png|webp|gif|avif|svg|ico|woff2?|ttf|otf)$/i;

export function pageUrl(value: string): string {
  const url = new URL(value);
  url.hash = '';
  return url.href;
}

export function localResource(value: string, base: string): string | undefined {
  try {
    const url = new URL(value, base);
    if (
      !/^https?:$/.test(url.protocol)
      || url.origin !== new URL(base).origin
      || mediaExtension.test(url.pathname)
    ) {
      return undefined;
    }
    url.hash = '';
    return url.href;
  }
  catch {
    return undefined;
  }
}

export function isMedia(request: Request): boolean {
  // 分段响应不能当作完整文件复用，连同音视频一起交还浏览器正常处理。
  return request.destination === 'audio' || request.destination === 'video'
    || request.headers.has('range') || mediaExtension.test(new URL(request.url).pathname);
}

export function isRuntime(request: Request): boolean {
  return request.destination === 'image' || request.destination === 'font'
    || runtimeExtension.test(new URL(request.url).pathname);
}

/** 只读取 HTML 明确声明的文件，不递归分析 CSS / JS。 */
export function declaredResource(
  tag: string,
  attrs: Map<string, string>,
  base: string,
): string | undefined {
  if (tag.toLowerCase() === 'script') {
    const src = attrs.get('src');
    return src ? localResource(src, base) : undefined;
  }
  const rel = (attrs.get('rel') ?? '').toLowerCase().split(/\s+/);
  // canonical、preconnect 等 link 不代表要随页面保存的文件，不能一概缓存。
  const allowed = rel.some((value) => [
    'stylesheet', 'icon', 'apple-touch-icon', 'modulepreload',
  ].includes(value))
  || (rel.includes('preload') && [
    'style', 'script', 'font', 'image',
  ].includes((attrs.get('as') ?? '').toLowerCase()));
  const href = attrs.get('href');
  return allowed && href ? localResource(href, base) : undefined;
}

function decodeAttribute(value: string): string {
  const entities: Record<string, string> = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' };
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt);/gi, (all, entity: string) => {
    if (!entity.startsWith('#')) return entities[entity.toLowerCase()] ?? all;
    const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '\ufffd';
  });
}

export function htmlResources(html: string, base: string): string[] {
  // 同一文件可能既 preload 又实际引用，只记录一个 URL；正文 img 不在扫描范围内。
  const resources = new Set<string>();
  // 跳过注释及脚本、样式正文，避免把字符串中的标签识别成页面资源。
  const tags = new RegExp([
    /<!--[\s\S]*?-->/.source,
    /<(script|style)\b(?:"[^"]*"|'[^']*'|[^'">])*\s*>(?:[\s\S]*?<\/\1\s*>|$)/.source,
    /<link\b(?:"[^"]*"|'[^']*'|[^'">])*>/.source,
  ].join('|'), 'gi');
  for (const [tag] of html.matchAll(tags)) {
    const opening = /^<(script|link)\b((?:"[^"]*"|'[^']*'|[^'">])*)>/i.exec(tag);
    if (!opening) continue;
    const attrs = new Map<string, string>();
    const attributes = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
    for (const match of opening[2].matchAll(attributes)) {
      const name = match[1].toLowerCase();
      if (!attrs.has(name)) attrs.set(name, decodeAttribute(match[2] ?? match[3] ?? match[4] ?? ''));
    }
    const resource = declaredResource(opening[1], attrs, base);
    if (resource) resources.add(resource);
  }
  return [...resources];
}
