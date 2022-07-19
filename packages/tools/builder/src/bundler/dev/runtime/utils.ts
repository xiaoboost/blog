import { createLogger } from './logger';
import { debounce } from '@xiao-ai/utils';

export const hmrLog = createLogger('HMR');
export const wbsLog = createLogger('Socket');

export function getSocketUrl() {
  const protocol = window.location.protocol === 'http:' ? 'ws://' : 'wss://';
  return `${protocol}${location.host}/`;
}

export function reloadPage() {
  debounce(() => window.location.reload());
}

export function reloadCSS() {
  function updateLinkElement(link: Element) {
    const newLink = link.cloneNode() as Element;
    const newHref = `${(link.getAttribute('href') ?? '').split('?')[0]}?${Date.now()}`;

    newLink.setAttribute('href', newHref);
    newLink.addEventListener('load', () => link.parentNode?.removeChild(link));

    link.parentNode?.insertBefore(newLink, link.nextSibling);
  }

  debounce(() => {
    const links = document.querySelectorAll('link[rel="stylesheet"]');

    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const href = link.getAttribute('href')!;
      const servedFromHMRServer = getSocketUrl();
      const absolute =
        /^https?:\/\//i.test(href) &&
        href.indexOf(window.location.origin) !== 0 &&
        !servedFromHMRServer;

      if (!absolute) {
        updateLinkElement(link);
      }
    }
  });
}

export function reloadElement(selector: string, content: string) {
  debounce(() => {
    const element = document.querySelector(selector);

    if (!element) {
      return;
    }

    element.innerHTML = content;
  });
}
