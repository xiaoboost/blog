import { getCurrentScriptSrc } from '@blog/web';
import { ModuleLoader, assets } from '@blog/context/web';
import { duration } from './constant';
import styles from './index.jss';

const { classes } = styles;

function active() {
  const list = document.querySelectorAll<HTMLElement>(
    `.${classes.blurReveal} .${classes.blurRevealOverlayBtn}`,
  );
  const handlerMap = new Map<HTMLElement, () => void>();

  function toggleBlurReveal(el: HTMLElement) {
    const btn = el as HTMLElement;
    const revealEl = btn.parentElement?.parentElement;

    if (!revealEl) {
      throw new Error('[BlurReveal Error]: 未能发现正确的"模糊遮盖组件"根节点');
    }

    const content = revealEl.querySelector(`.${classes.blurRevealContent}`) as HTMLElement;

    if (!content) {
      throw new Error('[BlurReveal Error]: 未能发现正确的"模糊遮盖组件"内容节点');
    }

    revealEl.classList.add(classes.blurRevealExpanded);
    content.style.maxHeight = `${content.scrollHeight}px`;

    setTimeout(() => {
      content.style.maxHeight = 'none';
    }, duration);
  }

  list.forEach((el) => {
    const handler = () => toggleBlurReveal(el);
    handlerMap.set(el, handler);
    el.addEventListener('click', handler);
  });

  return () => {
    list.forEach((el) => {
      const handler = handlerMap.get(el);
      if (handler) {
        el.removeEventListener('click', handler);
        handlerMap.delete(el);
      }
    });
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
