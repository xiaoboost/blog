import { supportsPassive, addClassName, removeClassName, MouseButtons } from '@xiao-ai/utils/web';
import { getScrollContainer, getDataFromEl, device } from '@blog/web';
import { ScrollMode } from './constant';

import styles from './index.jss';

const { classes: cla } = styles;

interface MouseState {
  /** 鼠标在移动 */
  isMoving: boolean;
  /** 鼠标在滚动条上 */
  isOver: boolean;
  /** 鼠标当前偏移量 */
  offset: number;
  /** 鼠标上次偏移量 */
  lastOffset: number;
}

export class ScrollBar {
  /** 滚动条容器 */
  private readonly _container: HTMLElement | Window;

  /** 滚动条长条 */
  private readonly scrollbar: HTMLElement;

  /** 滚动条 */
  private readonly slider: HTMLElement;

  /** 滚动条宽度 */
  private readonly width: number = -1;

  /** 滚动条模式 */
  private readonly mode: ScrollMode = 'x';

  /** 滚动隐藏定时器 */
  private hideScrollTimer = -1;

  /** 鼠标状态 */
  private mouse: MouseState = {
    isMoving: false,
    isOver: false,
    offset: -1,
    lastOffset: -1,
  };

  constructor(el: HTMLElement) {
    this.scrollbar = el;
    this.width = getDataFromEl<number>(el, 'width') ?? 8;
    this.mode = getDataFromEl<ScrollMode>(el, 'mode') ?? 'y';
    this._container = getScrollContainer(el, this.mode);
    this.slider = el.querySelector(`.${cla.slider}`)!;

    this.init();
  }

  /** 滚动条是否是垂直 */
  get isVertical() {
    return this.mode === 'y';
  }

  get isScrollWindow() {
    return this._container === window;
  }

  get clientLength() {
    const el = this.isScrollWindow ? document.documentElement : this.container;
    return this.isVertical ? el.clientHeight : el.clientWidth;
  }

  get scrollLength() {
    const el = this.isScrollWindow ? document.documentElement : this.container;
    return this.isVertical ? el.scrollHeight : el.scrollWidth;
  }

  get container() {
    return (this.isScrollWindow ? document.documentElement : this._container) as HTMLElement;
  }

  private init() {
    const {
      container,
      scrollbar,
      slider,
      scrollLength,
      clientLength,
      width,
      isVertical,
      isScrollWindow,
      mouse,
    } = this;

    // 非桌面端禁用此滚动条
    if (!device.desktop()) {
      addClassName(scrollbar, cla.disable);
      return;
    }

    // 容器不存在，或者是滚轴长度没有超过容器长度
    if (scrollLength <= clientLength) {
      scrollbar.style.display = 'none';
      return;
    }

    if (isVertical) {
      scrollbar.style.height = '100%';
      scrollbar.style.width = `${width}px`;
      slider.style.width = `${width}px`;
    } else {
      scrollbar.style.width = '100%';
      scrollbar.style.height = `${width}px`;
      slider.style.height = `${width}px`;
    }

    this.setSliderPositionFromContainer();

    const options: AddEventListenerOptions | boolean = !supportsPassive
      ? false
      : {
          passive: true,
          capture: false,
        };

    const triggerTrue = () => {
      mouse.isOver = true;
      this.triggerClass(true);
    };
    const triggerFalse = () => {
      mouse.isOver = false;
      this.delaySetScrollInvisible();
    };
    const startMouseMove = (ev: MouseEvent) => {
      if (!mouse.isMoving && ev.button === MouseButtons.Left) {
        mouse.isMoving = true;
        // 鼠标滑动时，不允许选中文本
        container.style.userSelect = 'none';
      }
    };
    const stopMouseMove = () => {
      const { mouse, container } = this;

      if (mouse.isMoving) {
        mouse.offset = -1;
        mouse.lastOffset = -1;
        mouse.isMoving = false;
        container.style.userSelect = '';
      }

      this.delaySetScrollInvisible();
    };

    scrollbar.addEventListener('mouseenter', triggerTrue, options);
    scrollbar.addEventListener('mouseleave', triggerFalse, options);
    slider.addEventListener('mousedown', startMouseMove, options);
    window.addEventListener('mouseup', stopMouseMove, options);
    window.addEventListener('mousemove', this.setSliderPositionFromMouse, options);
    container.addEventListener('scroll', this.setSliderPositionFromContainer, options);

    if (isScrollWindow) {
      scrollbar.style.position = 'fixed';
      window.addEventListener('resize', this.setSliderPositionFromContainer, options);
      window.addEventListener('scroll', this.setSliderPositionFromContainer, options);
    } else {
      // TODO: 内部元素应该用 ResizeObserver 监听
    }

    this.disable = () => {
      stopMouseMove();

      scrollbar.removeEventListener('mouseenter', triggerTrue, options);
      scrollbar.removeEventListener('mouseleave', triggerFalse, options);
      slider.removeEventListener('mousedown', startMouseMove, options);
      window.removeEventListener('mouseup', stopMouseMove, options);
      window.removeEventListener('mousemove', this.setSliderPositionFromMouse, options);
      container.removeEventListener('scroll', this.setSliderPositionFromContainer, options);

      if (isScrollWindow) {
        window.removeEventListener('resize', this.setSliderPositionFromContainer, options);
        window.removeEventListener('scroll', this.setSliderPositionFromContainer, options);
      } else {
        // TODO: 内部元素应该用 ResizeObserver 监听
      }
    };
  }

  /** 卸载组件 */
  disable = (): void => void 0;

  setSliderPositionFromContainer = () => {
    const { mouse } = this;

    if (mouse.isMoving) {
      return;
    }

    const {
      clientLength: client,
      scrollLength: scroll,
      container: parent,
      slider,
      isVertical,
    } = this;

    const scrollbarLen = (client / scroll) * client;
    const scrollOffset = ((isVertical ? parent.scrollTop : parent.scrollLeft) / scroll) * client;

    mouse.offset = scrollOffset;
    this.triggerClass(true);
    this.delaySetScrollInvisible();

    if (isVertical) {
      slider.style.height = `${scrollbarLen}px`;
      slider.style.top = `${scrollOffset}px`;
    } else {
      slider.style.width = `${scrollbarLen}px`;
      slider.style.left = `${scrollOffset}px`;
    }
  };

  setSliderPositionFromMouse = (ev: MouseEvent) => {
    const { mouse } = this;

    if (!mouse.isMoving) {
      return;
    }

    const { clientLength: client, scrollLength: scroll, slider, isVertical } = this;
    const currentOffset = isVertical ? ev.clientY : ev.clientX;

    if (mouse.offset === -1) {
      mouse.offset = isVertical
        ? Number.parseFloat(slider.style.top)
        : Number.parseFloat(slider.style.left);
    }

    if (mouse.lastOffset === -1) {
      mouse.lastOffset = currentOffset;
      return;
    }

    const offsetY = currentOffset - mouse.lastOffset;
    const scrollbarLen = (client / scroll) * client;

    mouse.lastOffset = currentOffset;
    mouse.offset += offsetY;

    let realOffset = mouse.offset;

    if (realOffset < 0) {
      realOffset = 0;
    }

    if (realOffset > client - scrollbarLen) {
      realOffset = client - scrollbarLen;
    }

    slider.style[isVertical ? 'top' : 'left'] = `${realOffset}px`;
    window.scrollTo({
      top: (realOffset / client) * scroll,
      behavior: 'auto',
    });
  };

  delaySetScrollInvisible = () => {
    if (this.hideScrollTimer !== -1) {
      clearTimeout(this.hideScrollTimer);
    }

    this.hideScrollTimer = window.setTimeout(() => {
      if (this.mouse.isOver) {
        return;
      }

      this.triggerClass(false);
    }, 300);
  };

  triggerClass = (visible: boolean) => {
    removeClassName(this.scrollbar, visible ? cla.invisible : cla.visible);
    addClassName(this.scrollbar, visible ? cla.visible : cla.invisible);
  };
}
