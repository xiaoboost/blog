import { fadeIn, fadeOut } from '@blog/web';
import { supportsPassive } from '@xiao-ai/utils/web';
import { scrollTopLimit, fadeTime } from './constant';

import styles from './index.jss';

const btn = document.body.querySelector<HTMLElement>(`.${styles.classes.gotoTop}`);
const body = btn?.parentElement;

if (btn && body) {
  const options: AddEventListenerOptions | boolean = !supportsPassive
    ? false
    : {
        passive: true,
        capture: false,
      };

  let inScrollTop = false;

  const scrollEvent = () => {
    const top = window.scrollY;

    if (top > scrollTopLimit) {
      fadeIn(btn, fadeTime);
    } else {
      fadeOut(btn, fadeTime);
      inScrollTop = false;
    }
  };

  // 初始化
  scrollEvent();
  // 滚动事件
  window.addEventListener('scroll', scrollEvent, options);

  // 按钮点击事件
  btn.addEventListener('click', (event) => {
    if (inScrollTop) {
      return;
    }

    inScrollTop = true;
    event.preventDefault();

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  });
}
