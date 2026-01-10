import { getCurrentScriptSrc } from '@blog/web';
import { ModuleLoader, assets } from '@blog/context/web';
import styles from './index.jss';

const { classes } = styles;

function active() {
  const list = document.querySelectorAll<HTMLElement>(`.${classes.glossWrapper}`);
  const handlerMap = new Map<HTMLElement, () => void>();

  function toggleGloss(wrapper: HTMLElement) {
    wrapper.classList.toggle(classes.glossActive);
  }

  list.forEach((el) => {
    const handler = () => toggleGloss(el);
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
