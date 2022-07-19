import { createLogger } from './logger';

let reloadTimeout: number | null = null;
let cssTimeout: number | null = null;

export const hmrLog = createLogger('HMR');
export const wbsLog = createLogger('Socket');

function isNumber(input: unknown): input is number {
  return typeof input === 'number';
}

export function getSocketUrl() {
  const protocol = window.location.protocol === 'http:' ? 'ws://' : 'wss://';
  return `${protocol}${location.host}/`;
}

export function reloadPage() {
  if (isNumber(reloadTimeout)) {
    return;
  }

  reloadTimeout = window.setTimeout(() => {
    try {
      window.location.reload();
    } finally {
      reloadTimeout = null;
    }
  });
}

function updateLinkElement(link: Element) {
  const newLink = link.cloneNode() as Element;
  const newHref = `${(link.getAttribute('href') ?? '').split('?')[0]}?${Date.now()}`;

  newLink.setAttribute('href', newHref);
  newLink.addEventListener('load', () => link.parentNode?.removeChild(link));

  link.parentNode?.insertBefore(newLink, link.nextSibling);
}

export function reloadAllCSS() {
  if (isNumber(cssTimeout)) {
    return;
  }

  cssTimeout = window.setTimeout(() => {
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

    cssTimeout = null;
  });
}
