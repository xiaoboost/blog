import styles from './index.jss';

import { isString } from '@xiao-ai/utils';
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

const elHasInfo = document.querySelectorAll<HTMLElement>(`pre span[${lsInfoAttrName}]`);
const infoEle = new InfoElement();

for (const el of Array.from(elHasInfo)) {
  const infoStr = el.getAttribute(lsInfoAttrName) ?? '';
  const infoData = JSON.parse(decodeURI(infoStr));

  el.setAttribute(lsInfoAttrName, '');

  if (!infoData) {
    break;
  }

  el.addEventListener('mouseenter', () => {
    infoEle.show(el.getBoundingClientRect(), infoData);
  });

  el.addEventListener('mouseleave', () => {
    infoEle.hidden();
  });

  // 页面滚动时，代码提示框要隐藏
  document.addEventListener('scroll', () => {
    infoEle.hidden();
  });
}
