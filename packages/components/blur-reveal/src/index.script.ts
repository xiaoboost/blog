import './theme/style.jss';
import { ModuleLoader, assets } from '@blog/context/web';
import { getCurrentScriptSrc } from '@blog/web';
import { duration } from './constant';
import styles from './index.jss';

const { classes } = styles;

function active() {
  const list = document.querySelectorAll<HTMLButtonElement>(
    `.${classes.blurReveal} .${classes.blurRevealOverlayBtn}`,
  );
  const handlerMap = new Map<HTMLButtonElement, () => void>();

  function toggleBlurReveal(btn: HTMLButtonElement) {
    const revealEl = btn.parentElement?.parentElement;

    if (!revealEl) {
      throw new Error('[BlurReveal Error]: 未能发现正确的"模糊遮盖组件"根节点');
    }

    const content = revealEl.querySelector(`.${classes.blurRevealContent}`) as HTMLElement;

    if (!content) {
      throw new Error('[BlurReveal Error]: 未能发现正确的"模糊遮盖组件"内容节点');
    }

    revealEl.classList.add(classes.blurRevealExpanded);
    btn.setAttribute('aria-expanded', 'true');
    content.setAttribute('aria-hidden', 'false');
    content.removeAttribute('inert');
    content.style.maxHeight = `${content.scrollHeight}px`;

    setTimeout(() => {
      content.style.maxHeight = 'none';
      [
        classes.blurRevealFogLeft, classes.blurRevealFogRight, classes.blurRevealOverlay,
      ].forEach(
        (className) => {
          const el = revealEl.querySelector<HTMLElement>(`.${className}`);
          if (el) {
            el.style.display = 'none';
          }
        },
      );
    }, duration * 1000);
  }

  list.forEach((el) => {
    const content = el.parentElement?.parentElement?.querySelector<HTMLElement>(
      `.${classes.blurRevealContent}`,
    );
    const handler = () => toggleBlurReveal(el);

    content?.setAttribute('inert', '');
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
}
else {
  active();
}

export default assets;
