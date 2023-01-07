import { isString } from '@xiao-ai/utils';
import { getCurrentScriptSrc } from '@blog/web';
import { ModuleLoader, assets } from '@blog/context/web';

import styles from './index.jss';
import { DisplaySymbol } from './typescript';
import { lsInfoAttrName } from './constant';

class InfoElement {
  private el: Element;

  private pre: Element;

  private list: HTMLElement[] = [];

  constructor() {
    const el = document.createElement('div');
    const pre = document.createElement('pre');

    el.setAttribute('class', styles.classes.lsInfoBox);
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
        text.textContent = info[1];
      }
    }
  }

  hidden() {
    if (document.body.contains(this.el)) {
      document.body.removeChild(this.el);
    }
  }

  show(rect: DOMRect, infos: DisplaySymbol[]) {
    if (!document.body.contains(this.el)) {
      document.body.appendChild(this.el);
    }

    this.setInfo(infos);
    this.el.setAttribute('style', `left: ${rect.left}px; top: ${rect.top + 1}px`);
  }
}

function active() {
  const infoEle = new InfoElement();
  const elHasInfo = document.querySelectorAll<HTMLElement>(`pre span[${lsInfoAttrName}]`);
  const hiddenEvent = () => infoEle.hidden();

  for (const el of Array.from(elHasInfo)) {
    const infoStr = el.getAttribute(lsInfoAttrName) ?? '';
    const infoData = JSON.parse(decodeURI(infoStr));

    // 生产模式需要移除语言服务信息
    if (process.env.NODE_ENV === 'production') {
      el.setAttribute(lsInfoAttrName, '');
    }

    if (!infoData) {
      break;
    }

    el.addEventListener('mouseenter', () => {
      infoEle.show(el.getBoundingClientRect(), infoData);
    });

    el.addEventListener('mouseleave', hiddenEvent);
    document.addEventListener('scroll', hiddenEvent);
  }

  return () => {
    infoEle.hidden();
    document.removeEventListener('scroll', hiddenEvent);

    /**
     * 至于为什么不移除元素列表的事件，详细见
     * https://stackoverflow.com/questions/6033821/do-i-need-to-remove-event-listeners-before-removing-elements
     */
  };
}

if (process.env.NODE_ENV === 'development') {
  ModuleLoader.install({
    currentScript: getCurrentScriptSrc(),
    active,
  });
} else {
  active();
}

export default assets;
