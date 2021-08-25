import styles from './index.jss';

import { lspInfoAttrName } from './constant';
import { isString } from '@xiao-ai/utils';
import { DisplaySymbol } from './typescript';

function createInfoDom(infos: DisplaySymbol []): HTMLElement {
  const infoSpan = infos.map((info) => {
    return isString(info)
      ? info
      : `<span class="${info[0]}">${info[1]}</span>`;
  });
  const code = `<div class="${styles.classes.lspInfoBox}"><pre>${infoSpan.join('')}</pre></div>`;
  const el = document.createElement('div');
  el.innerHTML = code;
  return el.children[0] as HTMLElement;
}

const elHasInfo = document.querySelectorAll<HTMLElement>(`pre span[${lspInfoAttrName}]`);

for (const el of Array.from(elHasInfo)) {
  const infoStr = el.getAttribute(lspInfoAttrName) ?? '';
  const infoData = JSON.parse(decodeURI(infoStr));

  el.removeAttribute(lspInfoAttrName);

  if (!infoData) {
    break;
  }

  const infoEle = createInfoDom(infoData);

  el.addEventListener('mouseenter', () => {
    const offset = el.getBoundingClientRect();

    document.body.appendChild(infoEle);
    infoEle.style.left = `${offset.left}px`;
    infoEle.style.top = `${offset.top}px`;
  });

  el.addEventListener('mouseleave', () => {
    document.body.removeChild(infoEle);
  });
}
