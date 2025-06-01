import { headerBodyMargin, mainWidth } from '@blog/styles/constant';
import { getCurrentScriptSrc } from '@blog/web';
import { ModuleLoader } from '@blog/context/web';
import { supportsPassive, addClassName, removeClassName } from '@xiao-ai/utils/web';

import tocStyles from './index.jss';
import postStyles from '../post/index.jss';
import { levelLimit, tocMarginLeft, tocWidth } from './constant';

const enum Status {
  Init,
  Follow,
  Static,
}

interface TitlePosition {
  title: string;
  offsetTop: number;
}

function active() {
  let menu = document.body.querySelector<HTMLElement>(`.${tocStyles.classes.toContent}`);
  let mainBody = menu?.parentElement;

  if (!menu || !mainBody) {
    return () => {
      menu = null;
      mainBody = null;
    };
  }

  const menuItems = Array.from(
    menu.querySelectorAll<HTMLLIElement>(`.${tocStyles.classes.menuItem}`),
  );
  const menuLists = Array.from(
    menu.querySelectorAll<HTMLLIElement>(
      `.${tocStyles.classes.menuList} .${tocStyles.classes.menuList}`,
    ),
  );
  const bodyTop = mainBody.offsetTop - headerBodyMargin;
  const options: AddEventListenerOptions | boolean = !supportsPassive
    ? false
    : {
        passive: true,
        capture: false,
      };

  let titlePosition: TitlePosition[] = [];
  let status = Status.Init;

  const scrollEvent = () => {
    if (!menu) {
      return;
    }

    const top = window.scrollY;

    if (top > bodyTop && (status === Status.Static || status === Status.Init)) {
      status = Status.Follow;
      menu.style.position = 'fixed';
      menu.style.top = `${headerBodyMargin}px`;
      menu.style.right = `calc(50vw - ${mainWidth / 2}px - ${tocWidth}px - ${tocMarginLeft}px)`;
    } else if (top <= bodyTop && (status === Status.Follow || status === Status.Init)) {
      status = Status.Static;
      menu.style.position = '';
      menu.style.top = '';
      menu.style.right = '';
    }

    const first = titlePosition.find((item) => item.offsetTop < top);
    const anchor = first && menu.querySelector<HTMLAnchorElement>(`[href="#${first.title}"]`);
    const highLightItem = anchor?.parentElement;
    const highLightListItem = highLightItem?.parentElement;

    menuItems.forEach((el) => {
      if (el === highLightItem) {
        addClassName(highLightItem, tocStyles.classes.menuItemHighlight);
      } else {
        removeClassName(el, tocStyles.classes.menuItemHighlight);
      }
    });

    menuLists.forEach((el) => {
      if (el === highLightListItem) {
        addClassName(highLightListItem, tocStyles.classes.menuListHighlight);
      } else {
        removeClassName(el, tocStyles.classes.menuListHighlight);
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
      .sort((pre, next) => (pre.offsetTop > next.offsetTop ? -1 : 1));
  };

  recordTitlePosition();
  scrollEvent();

  window.addEventListener('scroll', scrollEvent, options);
  window.addEventListener('resize', recordTitlePosition, options);

  return () => {
    menu = null;
    mainBody = null;
    menuItems.length = 0;
    menuLists.length = 0;

    window.removeEventListener('scroll', scrollEvent, options);
    window.removeEventListener('resize', recordTitlePosition, options);
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
