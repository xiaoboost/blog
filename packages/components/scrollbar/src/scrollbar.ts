import { supportsPassive, addClassName, removeClassName, MouseButtons } from '@xiao-ai/utils/web';
import { getScrollContainer, getDataFromEl } from '@blog/shared/web';
import { ScrollMode } from './constant';

import styles from './index.jss';

const { classes: cla } = styles;

export class ScrollBar {
  /** 滚动条长条 */
  private readonly scrollbar: HTMLElement;
  /** 滚动条容器 */
  private readonly container: HTMLElement | Window;
  /** 滚动条 */
  private readonly slider: HTMLElement;
  /** 滚动条宽度 */
  private readonly width: number = -1;
  /** 滚动条模式 */
  private readonly mode: ScrollMode = 'x';

  /** 鼠标正在移动 */
  private mouseMove = false;
  /** 鼠标当前偏移量 */
  private mouseOffset = 0;
  /** 鼠标上次偏移量 */
  private mouseLastOffset = -1;

  constructor(el: HTMLElement) {
    this.scrollbar = el;
    this.width = getDataFromEl<number>(el, 'width') ?? 8;
    this.mode = getDataFromEl<ScrollMode>(el, 'mode') ?? 'y';
    this.container = getScrollContainer(el, this.mode);
    this.slider = el.querySelector(`.${cla.slider}`)!;

    this.init();
  }

  /** 滚动条是否是垂直 */
  get isVertical() {
    return this.mode === 'y';
  }

  get clientLength() {
    return this.isVertical ? this.containerEl.clientHeight : this.containerEl.clientWidth;
  }

  get scrollLength() {
    return this.isVertical ? this.containerEl.scrollHeight : this.containerEl.scrollWidth;
  }

  /**
   * 容器 DOM 元素
   *   - 滚动事件很特殊，顶层事件必须挂在 window 上，但是普通的元素操作又必须用真正的元素
   */
  get containerEl() {
    return (this.container === window ? document.documentElement : this.container) as HTMLElement;
  }

  private init() {
    const {
      container,
      containerEl,
      scrollbar,
      slider,
      scrollLength,
      clientLength,
      isVertical,
      width,
    } = this;

    // 容器不存在，或者是滚轴长度没有超过容器长度
    if (!container || !containerEl || scrollLength <= clientLength) {
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
    this.tigerClass(this.scrollbar, true);

    const options: AddEventListenerOptions | boolean = !supportsPassive
      ? false
      : {
          passive: true,
          capture: false,
        };

    containerEl.addEventListener('mouseenter', () => this.tigerClass(scrollbar, true), options);
    containerEl.addEventListener('mouseleave', () => this.tigerClass(scrollbar, false), options);
    container.addEventListener('scroll', this.setSliderPositionFromContainer, options);
    slider.addEventListener('mousedown', this.startMouseMove, options);
    window.addEventListener('mouseup', this.stopMouseMove, options);
    window.addEventListener('mousemove', this.setSliderPositionFromMouse, options);

    if (container === window) {
      container.addEventListener('resize', this.setSliderPositionFromContainer, options);
    } else {
      // TODO: 内部元素应该用 ResizeObserver 监听
    }
  }

  setSliderPositionFromContainer = () => {
    if (this.mouseMove) {
      return;
    }

    const {
      clientLength: client,
      scrollLength: scroll,
      containerEl: parent,
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
    const offsetY = currentOffset - this.mouseLastOffset;

    if (this.mouseLastOffset === -1) {
      this.mouseLastOffset = currentOffset;
      return;
    }

    this.mouseLastOffset = currentOffset;
    this.mouseOffset += offsetY;

    let realOffset = this.mouseOffset;

    if (realOffset < 0) {
      realOffset = 0;
    }

    if (realOffset > client) {
      realOffset = client;
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
      this.containerEl.style.userSelect = 'none';
    }
  };

  stopMouseMove = () => {
    if (this.mouseMove) {
      this.mouseOffset = -1;
      this.mouseMove = false;
      this.containerEl.style.userSelect = '';
    }
  };

  tigerClass = (el: HTMLElement, visible: boolean) => {
    removeClassName(el, visible ? cla.invisible : cla.visible);
    addClassName(el, visible ? cla.visible : cla.invisible);
  };
}
