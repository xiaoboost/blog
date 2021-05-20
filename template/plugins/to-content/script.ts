import { elementId, marginTop } from './constant';
import { supportsPassive } from '../../utils/env';

const enum Status {
  Init,
  Follow,
  Static,
}

(() => {
  const menu = document.body.querySelector<HTMLElement>(`#${elementId}`);
  const mainBody = menu?.parentElement;

  if (!menu || !mainBody) {
    return;
  }

  const bodyTop = mainBody.offsetTop - marginTop;
  const options: AddEventListenerOptions | boolean = !supportsPassive ? false : {
    passive: true,
    capture: false,
  };

  let status = Status.Init;

  const scrollEvent = () => {
    const top = window.scrollY;

    if (top > bodyTop && (status === Status.Static || status === Status.Init)) {
      status = Status.Follow;
      menu.style.position = 'fixed';
      menu.style.top = `${marginTop}px`;
    }
    else if (top <= bodyTop && (status === Status.Follow || status === Status.Init)) {
      status = Status.Static;
      menu.style.position = '';
      menu.style.top = '';
    }
  };

  scrollEvent();
  window.addEventListener('scroll', scrollEvent, options);
})();
