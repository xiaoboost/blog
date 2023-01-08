import { fadeIn, fadeOut, getCurrentScriptSrc } from '@blog/web';
import { ModuleLoader } from '@blog/context/web';
import { supportsPassive } from '@xiao-ai/utils/web';
import { scrollTopLimit, fadeTime } from './constant';

import styles from './index.jss';

function active() {
  let btn = document.body.querySelector<HTMLElement>(`.${styles.classes.gotoTop}`);
  let body = btn?.parentElement;

  if (!btn || !body) {
    return () => {
      btn = null;
      body = null;
    };
  }

  const options: AddEventListenerOptions | boolean = !supportsPassive
    ? false
    : {
        passive: true,
        capture: false,
      };

  let inScrollTop = false;

  const scrollEvent = () => {
    if (!btn) {
      return;
    }

    const top = window.scrollY;

    if (top > scrollTopLimit) {
      fadeIn(btn, fadeTime);
    } else {
      fadeOut(btn, fadeTime);
      inScrollTop = false;
    }
  };
  const clickBtn = (event: MouseEvent) => {
    if (inScrollTop) {
      return;
    }

    inScrollTop = true;
    event.preventDefault();

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // 初始化
  scrollEvent();

  window.addEventListener('scroll', scrollEvent, options);
  btn.addEventListener('click', clickBtn);

  return () => {
    window.removeEventListener('scroll', scrollEvent, options);
    btn?.removeEventListener('click', clickBtn);

    btn = null;
    body = null;
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
