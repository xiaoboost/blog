export type ScrollMode = 'all' | 'x' | 'y';

export function getStyle(el: HTMLElement, name: string): string {
  if (name === 'float') {
    name = 'cssFloat';
  }

  try {
    const style = el.style[name];

    if (style) {
      return style;
    }

    const computed = document.defaultView?.getComputedStyle(el);
    return computed ? computed[name] : '';
  } catch (e) {
    return el.style[name];
  }
}

export function isScroll(el: HTMLElement, mode: ScrollMode) {
  const overflow =
    mode === 'all'
      ? getStyle(el, 'overflow')
      : mode === 'x'
      ? getStyle(el, 'overflow-x')
      : getStyle(el, 'overflow-y');

  return overflow.match(/(scroll|auto)/);
}

export function getScrollContainer(el: HTMLElement, mode: ScrollMode): Window | HTMLElement {
  let parent = el;

  while (parent) {
    if ([window, document, document.documentElement].includes(parent)) {
      return window;
    }

    if (isScroll(parent, mode)) {
      return parent;
    }

    parent = parent.parentElement as any;
  }

  return parent;
}

export function getCurrentScript() {
  const descriptor = Object.getOwnPropertyDescriptor(document, 'currentScript');

  // for chrome
  if (!descriptor && 'currentScript' in document && document.currentScript) {
    return document.currentScript;
  }

  // for other browsers with native support for currentScript
  if (descriptor && descriptor.get !== getCurrentScript && document.currentScript) {
    return document.currentScript;
  }

  // IE 8-10 support script readyState
  // IE 11+ & Firefox support stack trace
  try {
    throw new Error();
  } catch (err: any) {
    // Find the second match for the "at" string to get file src url from stack.
    const ieStackRegExp = /.*at [^(]*\((.*):(.+):(.+)\)$/gi;
    const ffStackRegExp = /@([^@]*):(\d+):(\d+)\s*$/gi;
    const stackDetails = ieStackRegExp.exec(err.stack) || ffStackRegExp.exec(err.stack);
    const scriptLocation = (stackDetails && stackDetails[1]) || false;
    const line = stackDetails?.[2] ? Number.parseInt(stackDetails?.[2], 10) : 0;
    const currentLocation = document.location.href.replace(document.location.hash, '');
    const scripts = document.getElementsByTagName('script');

    // try to find the matching external script first
    for (let i = 0; i < scripts.length; i++) {
      // If ready state is interactive, return the script tag
      if ((scripts[i] as any).readyState === 'interactive') {
        return scripts[i];
      }

      // If src matches, return the script tag
      if (scripts[i].src === scriptLocation) {
        return scripts[i];
      }
    }

    // if not found, the current script is likely inline
    if (scriptLocation === currentLocation) {
      const pageSource = document.documentElement.outerHTML;
      const inlineScriptSourceRegExp = new RegExp(
        `(?:[^\\n]+?\\n){0,${line - 2}}[^<]*<script>([\\d\\D]*?)<\\/script>[\\d\\D]*`,
        'i',
      );
      const inlineScriptSource = pageSource.replace(inlineScriptSourceRegExp, '$1').trim();

      // find the matching inline script
      for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].innerHTML && scripts[i].innerHTML.trim() === inlineScriptSource) {
          return scripts[i];
        }
      }
    }

    throw new Error('模块加载失败');
  }
}

export function getCurrentScriptSrc() {
  const script = getCurrentScript();
  const src = script.getAttribute('src');

  if (!src) {
    throw new Error('未能得到脚本路径');
  }

  return src;
}
