import { elementId, marginTop, highlightClassName, levelLimit } from './constant';

import {
  supportsPassive,
  addClassName,
  removeClassName,
} from '@xiao-ai/utils/dist/esm/web';

const enum Status {
  Init,
  Follow,
  Static,
}

interface TitlePosition {
  title: string;
  offsetTop: number;
}

(() => {
  const menu = document.body.querySelector<HTMLElement>(`#${elementId}`);
  const mainBody = menu?.parentElement;

  if (!menu || !mainBody) {
    return;
  }

  const menuItems = Array.from(menu.querySelectorAll<HTMLLIElement>('.menu-item'));
  const bodyTop = mainBody.offsetTop - marginTop;
  const options: AddEventListenerOptions | boolean = !supportsPassive ? false : {
    passive: true,
    capture: false,
  };
  let titlePosition: TitlePosition[] = [];

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

    const first = titlePosition.find((item) => item.offsetTop < top);
    const anchor = first && menu.querySelector<HTMLAnchorElement>(`[href="#${first.title}"]`);
    const highLightItem = anchor?.parentElement;

    menuItems.forEach((el) => {
      if (el === highLightItem) {
        addClassName(highLightItem, highlightClassName);
      }
      else {
        removeClassName(el, highlightClassName);
      }
    });
  };
  const recordTitlePosition = () => {
    const article = document.querySelector<HTMLElement>('.main-article');

    titlePosition = Array.from(article?.querySelectorAll<HTMLAreaElement>('.anchor') ?? [])
      .map((el) => {
        const parent = el.parentElement;
        const tag = parent?.tagName.toLowerCase();

        if (!tag || !parent) {
          return;
        }

        const level = Number(tag?.slice(1));
        return level <= levelLimit ? parent : undefined;
      })
      .map((el) => ({
        title: el?.getAttribute('id'),
        offsetTop: el?.offsetTop,
      }))
      .filter((item): item is TitlePosition => Boolean(item.title && item.offsetTop))
      .sort((pre, next) => pre.offsetTop > next.offsetTop ? -1 : 1);
  };

  recordTitlePosition();
  scrollEvent();

  window.addEventListener('scroll', scrollEvent, options);
  window.addEventListener('resize', recordTitlePosition, options);
})();
