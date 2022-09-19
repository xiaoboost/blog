import { createLogger } from './logger';
import { debounce } from '@xiao-ai/utils';
import { module } from './module';

export const hmrLog = createLogger('HMR');
export const wbsLog = createLogger('Socket');

export function getSocketUrl() {
  const protocol = window.location.protocol === 'http:' ? 'ws://' : 'wss://';
  return `${protocol}${location.host}/`;
}

export function reloadCSS(src: string) {
  debounce(() => {
    const link = document.querySelector(`link[href|="${src}"]`);

    if (!link) {
      return;
    }

    const newLink = link.cloneNode() as Element;
    const newHref = `${(link.getAttribute('href') ?? '').split('?')[0]}?${Date.now()}`;

    newLink.setAttribute('href', newHref);
    newLink.addEventListener('load', () => link.parentNode?.removeChild(link));

    link.parentNode?.insertBefore(newLink, link.nextSibling);
  })();
}

export function reloadHTML(selector: string, content: string) {
  debounce(() => {
    const element = document.querySelector(selector);

    if (!element) {
      return;
    }

    element.innerHTML = content;
    module.reload();
  })();
}

export function reloadJS(file: string, code: string) {
  module.uninstall(file);
  // TODO: 有时候会报 JSON 错误，需要再查
  // eslint-disable-next-line no-eval
  (0, eval)(code);
}

export function hasCSS(src: string) {
  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));

  return links.some((dom) => {
    const link = dom.getAttribute('href');

    if (link) {
      return link.indexOf(src) === 0;
    }

    return false;
  });
}

export function hasJs(src: string) {
  const links = Array.from(document.querySelectorAll('script[src]'));

  return links.some((dom) => {
    const link = dom.getAttribute('src');

    if (link) {
      return link.indexOf(src) === 0;
    }

    return false;
  });
}

export function isHTMLFile(filePath: string) {
  return filePath.indexOf(location.pathname) === 0;
}
