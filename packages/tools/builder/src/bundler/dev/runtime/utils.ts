import { createLogger } from './logger';
import { debounce } from '@xiao-ai/utils';
import { HMRUpdate, HMRUpdateKind } from '../types';

export const hmrLog = createLogger('HMR');
export const wbsLog = createLogger('Socket');

export function getSocketUrl() {
  const protocol = window.location.protocol === 'http:' ? 'ws://' : 'wss://';
  return `${protocol}${location.host}/`;
}

export function reloadPage() {
  debounce(() => window.location.reload());
}

function updateLinkElement(link: Element) {
  const newLink = link.cloneNode() as Element;
  const newHref = `${(link.getAttribute('href') ?? '').split('?')[0]}?${Date.now()}`;

  newLink.setAttribute('href', newHref);
  newLink.addEventListener('load', () => link.parentNode?.removeChild(link));

  link.parentNode?.insertBefore(newLink, link.nextSibling);
}

export function reloadCSS() {
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

function hasCSS(src: string) {
  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));

  return links.some((dom) => {
    const link = dom.getAttribute('href');

    if (link) {
      return link.indexOf(src) === 0;
    }

    return false;
  });
}

function isHTMLFile(filePath: string) {
  return filePath.indexOf(location.pathname) === 0;
}

export function updatePage(updates: HMRUpdate[]) {
  for (const data of updates) {
    hmrLog(`Update '${data.path}'`);

    switch (data.kind) {
      case HMRUpdateKind.HTML:
        if (isHTMLFile(data.path)) {
          reloadElement(data.selector, data.content);
        }
        break;

      case HMRUpdateKind.CSS:
        if (hasCSS(data.path)) {
          reloadCSS();
        }
        break;

      case HMRUpdateKind.JS:
        hmrLog(`Reload Page`);
        reloadPage();
        break;

      default:
        hmrLog(`Unknown update kind: ${(data as any).kind}`);
        break;
    }
  }
}
