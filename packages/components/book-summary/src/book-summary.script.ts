import { ModuleLoader, assets } from '@blog/context/web';
import { getCurrentScriptSrc, Popover, device, createElement } from '@blog/web';
import { ComponentAttrName } from './constant';
import { BookCache } from './types';

import styles from './index.jss';

function render(data: BookCache, lastDom?: HTMLElement) {
  let dom = lastDom;

  if (!dom) {
    dom = createElement(
      'div',
      {
        className: styles.classes.bookPopover,
      },
      [
        createElement(
          'div',
          {
            className: styles.classes.bookCoverBox,
          },
          [createElement('img')],
        ),
        createElement(
          'div',
          {
            className: styles.classes.bookDescription,
          },
          [
            createElement('div', { className: styles.classes.bookTitle }),
            createElement('div', { className: styles.classes.bookAuthorBox }, [
              createElement('a', {
                className: styles.classes.bookAuthor,
                target: '_blank',
                rel: 'noreferrer',
              }),
              createElement('span', { className: styles.classes.bookAuthorIcon }, ['著']),
            ]),
            createElement('p', { className: styles.classes.bookIntro }),
          ],
        ),
      ],
    );
  }

  const img = dom.querySelector(`.${styles.classes.bookCoverBox} img`)!;
  const title = dom.querySelector(`.${styles.classes.bookTitle}`)!;
  const author = dom.querySelector(`.${styles.classes.bookAuthor}`)!;
  const intro = dom.querySelector(`.${styles.classes.bookIntro}`)!;

  img.setAttribute('src', data.coverUrl);
  author.setAttribute('href', data.authorUrl);

  title.textContent = data.title;
  author.textContent = data.authorName;
  intro.textContent = data.intro;

  return dom;
}

function active() {
  const bookEls = Array.from(document.querySelectorAll<HTMLElement>(`a[${ComponentAttrName}]`));
  const clearAttr = () => {
    if (process.env.NODE_ENV === 'production') {
      bookEls.forEach((el) => el.setAttribute(ComponentAttrName, ''));
    }
  };

  if (!device.desktop()) {
    clearAttr();
    return () => void 0;
  }

  const popover = new Popover<BookCache>({
    render,
  });

  for (const el of bookEls) {
    const infoStr = el.getAttribute(ComponentAttrName) ?? '';
    const data = JSON.parse(decodeURI(infoStr));

    if (!data) {
      continue;
    }

    el.addEventListener('mouseenter', () => popover.show(el, data));
    el.addEventListener('mouseleave', () => popover.hidden());
  }

  clearAttr();

  return () => {
    popover.hidden();
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
