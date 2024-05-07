/* eslint-disable max-classes-per-file */

import { isString } from '@xiao-ai/utils';
import { removeClassName, addClassName } from '@xiao-ai/utils/web';
import { computePosition, autoUpdate, flip, shift, offset, inline } from '@floating-ui/dom';
import { getCurrentScriptSrc } from '@blog/web';
import { ModuleLoader, assets } from '@blog/context/web';

import styles from './index.jss';
import { DisplaySymbol } from './typescript';
import { lsInfoAttrName, lsErrorTokenAttrName, lsErrorByAttrName } from './constant';

class InfoElement {
  private el: HTMLElement;

  private pre: HTMLElement;

  private list: HTMLElement[] = [];

  private cleanup?: () => void;

  constructor() {
    const el = document.createElement('div');
    const pre = document.createElement('pre');

    el.setAttribute('class', styles.classes.lsInfoBox);
    el.setAttribute('style', 'opacity: 0');
    el.appendChild(pre);

    this.el = el;
    this.pre = pre;
  }

  private setInfo(infos: DisplaySymbol[]) {
    const { list, pre } = this;

    while (this.list.length > infos.length) {
      pre.removeChild(this.list.pop()!);
    }

    for (let i = 0; i < infos.length; i++) {
      const info = infos[i];

      let text: HTMLElement;

      if (list[i]) {
        text = list[i];
      } else {
        text = document.createElement('span');
        list.push(text);
        pre.appendChild(text);
      }

      if (isString(info)) {
        text.removeAttribute('class');
        text.textContent = info;
      } else {
        text.setAttribute('class', info[0]);
        [, text.textContent] = info;
      }
    }
  }

  hidden() {
    const { el } = this;

    if (document.body.contains(el)) {
      el.setAttribute('style', 'opacity: 0');
      document.body.removeChild(el);
    }

    this.cleanup?.();
    this.cleanup = undefined;
  }

  show(reference: HTMLElement, infos: DisplaySymbol[]) {
    if (!document.body.contains(this.el)) {
      document.body.appendChild(this.el);
    }

    const updatePosition = () => {
      computePosition(reference, this.el, {
        placement: 'top-start',
        strategy: 'fixed',
        middleware: [
          flip(),
          shift(),
          inline(),
          offset({
            crossAxis: 0,
            mainAxis: 14,
          }),
        ],
      }).then(({ x, y }) => {
        this.el.setAttribute('style', `left: ${x}px; top: ${y}px`);
      });
    };

    this.setInfo(infos);
    this.cleanup = autoUpdate(reference, this.el, updatePosition);
  }
}

function active() {
  const infoEle = new InfoElement();
  const elHasInfo = document.querySelectorAll<HTMLElement>(`pre span[${lsInfoAttrName}]`);
  const errorTokenEl = document.querySelectorAll<HTMLElement>(`pre span[${lsErrorTokenAttrName}]`);
  const hiddenEvent = () => infoEle.hidden();

  for (const el of Array.from(elHasInfo)) {
    const infoStr = el.getAttribute(lsInfoAttrName) ?? '';
    const infoData = JSON.parse(decodeURI(infoStr));

    // 生产模式需要移除语言服务信息
    if (process.env.NODE_ENV === 'production') {
      el.setAttribute(lsInfoAttrName, '');
    }

    if (!infoData) {
      continue;
    }

    el.addEventListener('mouseenter', () => {
      infoEle.show(el, infoData);
    });

    el.addEventListener('mouseleave', hiddenEvent);
  }

  for (const el of Array.from(errorTokenEl)) {
    const tokenId = el.getAttribute(lsErrorTokenAttrName);
    const errorLineEl = Array.from(
      document.querySelectorAll<HTMLElement>(`pre [${lsErrorByAttrName}="${tokenId}"]`),
    );

    // 生产模式需要移除语言服务信息
    if (process.env.NODE_ENV === 'production') {
      el.setAttribute(lsErrorTokenAttrName, '');
      errorLineEl.forEach((el) => el.removeAttribute(lsErrorByAttrName));
    }

    el.addEventListener('mouseenter', () => {
      errorLineEl.forEach((el) => addClassName(el, styles.classes.lspErrorLineHighlight));
    });

    el.addEventListener('mouseleave', () => {
      errorLineEl.forEach((el) => removeClassName(el, styles.classes.lspErrorLineHighlight));
    });
  }

  return () => {
    infoEle.hidden();

    /**
     * 为什么不移除元素列表的事件，详细见
     * https://stackoverflow.com/questions/6033821/do-i-need-to-remove-event-listeners-before-removing-elements
     */
  };
}

if (process.env.NODE_ENV === 'development' && ModuleLoader) {
  ModuleLoader.install({
    currentScript: getCurrentScriptSrc(),
    active,
  });
} else {
  active();
}

export default assets;
