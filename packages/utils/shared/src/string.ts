export function replaceText(content: string, range: [number, number], newText = '') {
  const leftText = content.substring(0, range[0]);
  const rightText = content.substring(range[1], content.length);
  return `${leftText}${newText}${rightText}`;
}

export const HTTP_PATTERNS = /^(https?:)?\/\//;
export const DATAURL_PATTERNS = /^data:/;
export const isUrl = (source: string) =>
  HTTP_PATTERNS.test(source) || DATAURL_PATTERNS.test(source);
