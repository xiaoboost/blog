import { computePosition, autoUpdate, flip, shift, offset, inline } from '@floating-ui/dom';

export interface PopoverOptions<T> {
  /** 浮层类名 */
  className?: string;
  /** 从数据创建元素 */
  render(data: T, lastDom?: HTMLElement): HTMLElement;
}

export class Popover<T> {
  private el: HTMLElement;

  private dom?: HTMLElement;

  private current?: T;

  private cleanup?: () => void;

  private readonly render: (data: T, lastDom?: HTMLElement) => HTMLElement;

  constructor(opt: PopoverOptions<T>) {
    const el = document.createElement('div');

    if (opt.className) {
      el.setAttribute('class', opt.className);
    }

    el.setAttribute('style', 'opacity: 0; position: fixed;');

    this.el = el;
    this.render = opt.render;
  }

  hidden() {
    const { el } = this;

    if (document.body.contains(el)) {
      el.setAttribute('style', 'opacity: 0');
      document.body.removeChild(el);
    }

    this.cleanup?.();
    this.cleanup = undefined;
  }

  show(reference: HTMLElement, data: T) {
    if (!document.body.contains(this.el)) {
      document.body.appendChild(this.el);
    }

    const updatePosition = () => {
      computePosition(reference, this.el, {
        placement: 'top-start',
        strategy: 'fixed',
        middleware: [
          flip(),
          shift(),
          inline(),
          offset({
            crossAxis: 0,
            mainAxis: 14,
          }),
        ],
      }).then(({ x, y }) => {
        this.el.setAttribute('style', `left: ${x}px; top: ${y}px; position: fixed;`);
      });
    };

    if (this.current !== data) {
      this.dom = this.render(data, this.dom);
      this.current = data;
    }

    if (this.dom && !this.el.contains(this.dom)) {
      this.el.appendChild(this.dom);
    }

    this.cleanup = autoUpdate(reference, this.el, updatePosition);
  }
}
