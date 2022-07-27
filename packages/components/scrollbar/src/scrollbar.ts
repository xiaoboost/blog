import { supportsPassive, addClassName, removeClassName, MouseButtons } from '@xiao-ai/utils/web';
import { getScrollContainer, getDataFromEl } from '@blog/shared/web';
import { ScrollMode } from './constant';

import styles from './index.jss';

const { classes: cla } = styles;

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

  /** 鼠标正在移动 */
  private mouseMove = false;
  /** 鼠标当前偏移量 */
  private mouseOffset = -1;
  /** 鼠标上次偏移量 */
  private mouseLastOffset = -1;

  /** 卸载组件 */
  disable!: () => void;

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
    } = this;

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
    this.triggerClass(this.scrollbar, true);

    const options: AddEventListenerOptions | boolean = !supportsPassive
      ? false
      : {
          passive: true,
          capture: false,
        };

    const triggerTrue = () => this.triggerClass(scrollbar, true);
    const triggerFalse = () => this.triggerClass(scrollbar, true);

    container.addEventListener('mouseenter', triggerTrue, options);
    container.addEventListener('mouseleave', triggerFalse, options);
    container.addEventListener('scroll', this.setSliderPositionFromContainer, options);
    slider.addEventListener('mousedown', this.startMouseMove, options);
    window.addEventListener('mouseup', this.stopMouseMove, options);
    window.addEventListener('mousemove', this.setSliderPositionFromMouse, options);

    if (isScrollWindow) {
      scrollbar.style.position = 'fixed';
      window.addEventListener('resize', this.setSliderPositionFromContainer, options);
      window.addEventListener('scroll', this.setSliderPositionFromContainer, options);
    } else {
      // TODO: 内部元素应该用 ResizeObserver 监听
    }

    this.disable = () => {
      this.stopMouseMove();

      container.removeEventListener('mouseenter', triggerTrue, options);
      container.removeEventListener('mouseleave', triggerFalse, options);
      container.removeEventListener('scroll', this.setSliderPositionFromContainer, options);
      slider.removeEventListener('mousedown', this.startMouseMove, options);
      window.removeEventListener('mouseup', this.stopMouseMove, options);
      window.removeEventListener('mousemove', this.setSliderPositionFromMouse, options);

      if (isScrollWindow) {
        window.removeEventListener('resize', this.setSliderPositionFromContainer, options);
        window.removeEventListener('scroll', this.setSliderPositionFromContainer, options);
      } else {
        // TODO: 内部元素应该用 ResizeObserver 监听
      }
    };
  }

  setSliderPositionFromContainer = () => {
    if (this.mouseMove) {
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

    this.mouseOffset = scrollOffset;

    if (isVertical) {
      slider.style.height = `${scrollbarLen}px`;
      slider.style.top = `${scrollOffset}px`;
    } else {
      slider.style.width = `${scrollbarLen}px`;
      slider.style.left = `${scrollOffset}px`;
    }
  };

  setSliderPositionFromMouse = (mouse: MouseEvent) => {
    if (!this.mouseMove) {
      return;
    }

    const { clientLength: client, scrollLength: scroll, slider, isVertical } = this;
    const currentOffset = isVertical ? mouse.clientY : mouse.clientX;

    if (this.mouseOffset === -1) {
      this.mouseOffset = isVertical
        ? Number.parseFloat(slider.style.top)
        : Number.parseFloat(slider.style.left);
    }

    if (this.mouseLastOffset === -1) {
      this.mouseLastOffset = currentOffset;
      return;
    }

    const offsetY = currentOffset - this.mouseLastOffset;
    const scrollbarLen = (client / scroll) * client;

    this.mouseLastOffset = currentOffset;
    this.mouseOffset += offsetY;

    let realOffset = this.mouseOffset;

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

  startMouseMove = (mouse: MouseEvent) => {
    if (!this.mouseMove && mouse.button === MouseButtons.Left) {
      this.mouseMove = true;
      // 鼠标滑动时，不允许选中文本
      this.container.style.userSelect = 'none';
    }
  };

  stopMouseMove = () => {
    if (this.mouseMove) {
      this.mouseOffset = -1;
      this.mouseLastOffset = -1;
      this.mouseMove = false;
      this.container.style.userSelect = '';
    }
  };

  triggerClass = (el: HTMLElement, visible: boolean) => {
    removeClassName(el, visible ? cla.invisible : cla.visible);
    addClassName(el, visible ? cla.visible : cla.invisible);
  };
}
