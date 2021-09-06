import { levelLimit } from './constant';
import { headerBodyMargin } from '@blog/styles/src/constant';
import { supportsPassive, addClassName, removeClassName } from '@xiao-ai/utils/web';

import tocStyles from './index.jss';
import postStyles from '../post/index.jss';

const enum Status {
  Init,
  Follow,
  Static,
}

interface TitlePosition {
  title: string;
  offsetTop: number;
}

const menu = document.body.querySelector<HTMLElement>(`.${tocStyles.classes.toContent}`);
const mainBody = menu?.parentElement;

if (menu && mainBody) {
  const menuItems = Array.from(
    menu.querySelectorAll<HTMLLIElement>(`.${tocStyles.classes.menuItem}`),
  );
  const bodyTop = mainBody.offsetTop - headerBodyMargin;
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
      menu.style.top = `${headerBodyMargin}px`;
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
        addClassName(highLightItem, tocStyles.classes.menuItemHighlight);
      }
      else {
        removeClassName(el, tocStyles.classes.menuItemHighlight);
      }
    });
  };
  const recordTitlePosition = () => {
    const article = document.querySelector<HTMLElement>(`.${postStyles.classes.postDefault}`);

    titlePosition = Array.from(
      article?.querySelectorAll<HTMLAreaElement>(`.${postStyles.classes.postAnchor}`) ?? [],
    )
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
}
