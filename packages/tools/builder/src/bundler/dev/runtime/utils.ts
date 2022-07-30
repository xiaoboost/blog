import { createLogger } from './logger';
import { debounce } from '@xiao-ai/utils';
import { module } from './module';

export const hmrLog = createLogger('HMR');
export const wbsLog = createLogger('Socket');

export function getSocketUrl() {
  const protocol = window.location.protocol === 'http:' ? 'ws://' : 'wss://';
  return `${protocol}${location.host}/`;
}

function updateLinkElement(link: Element) {
  const newLink = link.cloneNode() as Element;
  const newHref = `${(link.getAttribute('href') ?? '').split('?')[0]}?${Date.now()}`;

  newLink.setAttribute('href', newHref);
  newLink.addEventListener('load', () => link.parentNode?.removeChild(link));

  link.parentNode?.insertBefore(newLink, link.nextSibling);
}

export function reloadCSS(src: string) {
  debounce(() => {
    const links = document.querySelectorAll('link[rel="stylesheet"]');

    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const href = link.getAttribute('href')!;

      if (!href || href.includes(src)) {
        continue;
      }

      const servedFromHMRServer = getSocketUrl();
      const absolute =
        /^https?:\/\//i.test(href) &&
        href.indexOf(window.location.origin) !== 0 &&
        !servedFromHMRServer;

      if (!absolute) {
        updateLinkElement(link);
      }
    }
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
