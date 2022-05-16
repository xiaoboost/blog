import { supportsPassive, addClassName, removeClassName } from '@xiao-ai/utils/web';

import styles from './index.jss';

const { classes: cla } = styles;

const scrollbar = document.body.querySelector<HTMLElement>(`.${cla.scrollbar}`);
const slider = document.body.querySelector<HTMLElement>(`.${cla.scrollbar} .${cla.slider}`);
const container = scrollbar?.parentElement;

if (scrollbar && slider && container) {
  const options: AddEventListenerOptions | boolean = !supportsPassive
    ? false
    : {
        passive: true,
        capture: false,
      };

  let dropMoveScrollbar = false;
  let dropMouseOffsetTop = 0;
  let dropMouseLastOffsetTop = -1;

  const getClientHeight = () => document.body.clientHeight;
  const getScrollHeight = () => document.body.scrollHeight;
  const tigerClass = (el: HTMLElement, visible: boolean) => {
    removeClassName(el, visible ? cla.invisible : cla.visible);
    addClassName(el, visible ? cla.visible : cla.invisible);
  };
  const setSliderPositionFromWindow = () => {
    if (dropMoveScrollbar) {
      return;
    }

    const scrollbarHeight = (getClientHeight() / getScrollHeight()) * getClientHeight();
    const scrollbarTop = (window.scrollY / getScrollHeight()) * getClientHeight();
    dropMouseOffsetTop = scrollbarTop;
    slider.style.height = `${scrollbarHeight}px`;
    slider.style.top = `${scrollbarTop}px`;
  };
  const setSliderPositionFromMouse = (mouse: MouseEvent) => {
    if (!dropMoveScrollbar) {
      return;
    }

    if (dropMouseLastOffsetTop === -1) {
      dropMouseLastOffsetTop = mouse.clientY;
      return;
    }

    const offsetY = mouse.clientY - dropMouseLastOffsetTop;

    dropMouseLastOffsetTop = mouse.clientY;
    dropMouseOffsetTop += offsetY;

    slider.style.top = `${dropMouseOffsetTop}px`;
    window.scrollTo({
      top: (dropMouseOffsetTop / getClientHeight()) * getScrollHeight(),
      behavior: 'auto',
    });
  };
  const startDropMouseMove = () => {
    if (!dropMoveScrollbar) {
      dropMoveScrollbar = true;
      // 鼠标滑动时，不允许选中文本
      container.style.userSelect = 'none';
    }
  };
  const stopDropMouseMove = () => {
    if (dropMoveScrollbar) {
      dropMouseLastOffsetTop = -1;
      dropMoveScrollbar = false;
      container.style.userSelect = '';
    }
  };

  // 子元素高度大于窗口高度
  if (getScrollHeight() > getClientHeight()) {
    // 初始化
    setSliderPositionFromWindow();
    tigerClass(scrollbar, true);

    container.addEventListener('mouseenter', () => tigerClass(scrollbar, true), options);
    container.addEventListener('mouseleave', () => tigerClass(scrollbar, false), options);
    window.addEventListener('scroll', setSliderPositionFromWindow, options);

    slider.addEventListener('mousedown', startDropMouseMove, options);
    window.addEventListener('mouseup', stopDropMouseMove, options);
    window.addEventListener('mousemove', setSliderPositionFromMouse, options);
    window.addEventListener('resize', setSliderPositionFromWindow, options);
  } else {
    scrollbar.style.display = 'none';
  }
}
