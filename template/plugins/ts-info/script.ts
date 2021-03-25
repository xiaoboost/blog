import { parseJSON } from '@build/utils/object';
import { isString } from '@build/utils/assert';
import { DisplaySymbol } from '@build/markdown/typescript';

function createInfoDom(infos: DisplaySymbol[]) {
  const infoSpan = infos.map((info) => {
    return isString(info)
      ? info
      : `<span class="${info[0]}">${info[1]}</span>`;
  });
  const code = `<div class="ls-info-box"><pre>${infoSpan.join('')}</pre></div>`;
  const el = document.createElement('div');
  el.innerHTML = code;
  return el.children[0];
}

Array.from(document.querySelectorAll<HTMLElement>('pre span[ls-info]')).forEach((el) => {
  const infoStr = el.getAttribute('ls-info') ?? '';
  const infoData = parseJSON(infoStr.replace(/'/g, '"'));
  
  el.removeAttribute('ls-info');

  if (!infoData) {
    return;
  }

  const infoEle = createInfoDom(infoData);

  el.addEventListener('mouseenter', () => {
    // document.body.appendChild(infoEle);
  });

  el.addEventListener('mouseleave', () => {
    // document.body.removeChild(infoEle);
  });
});
