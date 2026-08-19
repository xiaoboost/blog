import { ModuleLoader, assets } from '@blog/context/web';
import { getCurrentScriptSrc } from '@blog/web';
import styles from './index.jss';

const { classes } = styles;

function active() {
  const list = document.querySelectorAll<HTMLButtonElement>(
    `.${classes.glossWrapper} .${classes.glossContent}`,
  );
  const handlerMap = new Map<HTMLButtonElement, () => void>();

  function toggleGloss(button: HTMLButtonElement) {
    const wrapper = button.closest<HTMLElement>(`.${classes.glossWrapper}`);
    const description = wrapper?.querySelector<HTMLElement>(`.${classes.glossDescription}`);

    if (!wrapper || !description) {
      throw new Error('[TextGloss Error]: 未能发现正确的文字夹注组件结构');
    }

    const expanded = wrapper.classList.toggle(classes.glossActive);
    button.setAttribute('aria-expanded', String(expanded));
    description.setAttribute('aria-hidden', String(!expanded));
    description.toggleAttribute('inert', !expanded);
  }

  list.forEach((el) => {
    const description = el.parentElement?.querySelector<HTMLElement>(`.${classes.glossDescription}`);
    const handler = () => toggleGloss(el);

    description?.setAttribute('inert', '');
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
