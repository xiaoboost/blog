import { ModuleLoader } from '@blog/context/web';
import { headerBodyMargin, mainWidth } from '@blog/styles/common';
import { getCurrentScriptSrc } from '@blog/web';
import { supportsPassive, addClassName, removeClassName } from '@xiao-ai/utils/web';

import postStyles from '../post/index.jss';
import { levelLimit, tocMarginLeft, tocWidth } from './constant';
import tocStyles from './index.jss';
import { getHeadHref } from './utils';

const enum Status {
  Init,
  Follow,
  Static,
}

interface TitlePosition {
  title: string;
  top: number;
}

function active() {
  let menu = document.body.querySelector<HTMLElement>(`.${tocStyles.classes.toContent}`);
  const mainBody = menu?.parentElement;
  const article = document.querySelector<HTMLElement>(`.${postStyles.classes.postDefault}`);

  if (!menu || !mainBody || !article) {
    return () => {};
  }

  const menuItems = Array.from(
    menu.querySelectorAll<HTMLLIElement>(`.${tocStyles.classes.menuItem}`),
  );
  const menuLists = Array.from(
    menu.querySelectorAll<HTMLLIElement>(
      `.${tocStyles.classes.menuList} .${tocStyles.classes.menuList}`,
    ),
  );
  const options: AddEventListenerOptions | boolean = !supportsPassive
    ? false
    : {
      passive: true,
      capture: false,
    };

  let titlePosition: TitlePosition[] = [];
  let bodyTop = 0;
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
    }
    else if (top <= bodyTop && (status === Status.Follow || status === Status.Init)) {
      status = Status.Static;
      menu.style.position = '';
      menu.style.top = '';
      menu.style.right = '';
    }

    // 锚点跳转可能把滚动位置取整，允许 1px 的误差。
    const first = titlePosition.find((item) => item.top <= top + 1);
    const anchor = first && menu.querySelector<HTMLAnchorElement>(`[href="${getHeadHref(first.title)}"]`);
    const highLightItem = anchor?.parentElement;
    const highLightListItem = highLightItem?.parentElement;

    for (const el of menuItems) {
      if (el === highLightItem) {
        addClassName(highLightItem, tocStyles.classes.menuItemHighlight);
      }
      else {
        removeClassName(el, tocStyles.classes.menuItemHighlight);
      }
    }

    for (const el of menuLists) {
      if (el === highLightListItem) {
        addClassName(highLightListItem, tocStyles.classes.menuListHighlight);
      }
      else {
        removeClassName(el, tocStyles.classes.menuListHighlight);
      }
    }
  };
  const updateLayout = () => {
    const scrollY = window.scrollY;
    bodyTop = mainBody.getBoundingClientRect().top + scrollY - headerBodyMargin;

    titlePosition = Array.from(article.querySelectorAll<HTMLAnchorElement>(`.${postStyles.classes.postAnchor}`))
      .flatMap((anchor) => {
        const heading = anchor.parentElement;
        const level = Number(heading?.tagName.slice(1));

        if (heading?.id && level <= levelLimit) {
          return [{ title: heading.id, top: heading.getBoundingClientRect().top + scrollY }];
        }

        return [];
      })
      .sort((pre, next) => next.top - pre.top);
    scrollEvent();
  };

  updateLayout();

  // 图片和字体加载都可能在没有滚动事件时改变正文高度。
  const articleObserver = new ResizeObserver(updateLayout);
  articleObserver.observe(article);
  window.addEventListener('scroll', scrollEvent, options);
  window.addEventListener('resize', updateLayout, options);

  return () => {
    menu = null;
    menuItems.length = 0;
    menuLists.length = 0;

    articleObserver.disconnect();
    window.removeEventListener('scroll', scrollEvent, options);
    window.removeEventListener('resize', updateLayout, options);
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
