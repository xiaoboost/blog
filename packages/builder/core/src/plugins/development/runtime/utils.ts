import { debounce } from '@xiao-ai/utils';
import { createLogger } from './logger';
import { module } from './module';

export const hmrLog = createLogger('HMR');
export const wbsLog = createLogger('Socket');

export function getSocketUrl() {
  const protocol = window.location.protocol === 'http:' ? 'ws://' : 'wss://';
  return `${protocol}${location.host}/`;
}

export function reloadCSS(src: string) {
  debounce(() => {
    // 已热更新的链接带有时间戳，后续更新仍按原始资源路径匹配。
    const link = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
      .find((item) => item.getAttribute('href')?.split('?')[0] === src.split('?')[0]);

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
  const scripts = Array.from(document.querySelectorAll<HTMLScriptElement>('script[src]'));
  const needsReload = scripts.some((script) => (
    script.getAttribute('src')?.split('?')[0] === file.split('?')[0]
    && (document.head.contains(script) || script.type === 'module' || script.defer || script.async || script.crossOrigin)
  ));
  if (needsReload) {
    // 保留 head 脚本及带加载配置的脚本的执行时机、模块类型和请求方式。
    location.reload();
    return;
  }

  module.uninstall(file);
  // 使用真实脚本元素，保证所有模块都能通过公共方法取得当前脚本路径。
  const script = document.createElement('script');
  script.setAttribute('data-script-src', file);
  script.textContent = code;
  try {
    document.head.appendChild(script);
  }
  finally {
    script.remove();
  }
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
  const normalize = (path: string) => path.replace(/\/index\.html$/, '/').replace(/\/$/, '');
  return normalize(filePath) === normalize(location.pathname);
}
