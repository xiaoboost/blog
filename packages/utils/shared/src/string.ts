export const HTTP_PATTERNS = /^(https?:)?\/\//;
export const DATAURL_PATTERNS = /^data:/;
export const isUrl = (source: string) =>
  HTTP_PATTERNS.test(source) || DATAURL_PATTERNS.test(source);
