import { normalize } from '@blog/node';
import type { IRenderContext, IPage, PageDataMap, PageType } from '@blog/types';
import { ResourceSet } from './resource-set';

export interface PageOptions<T extends PageType = PageType> {
  type: T;
  pathname: string;
  title: string;
  data: PageDataMap[T];
  render: (props: IRenderContext) => string;
}

export class Page<T extends PageType = PageType> extends ResourceSet implements IPage<T> {
  readonly type: T;
  readonly pathname: string;
  readonly title: string;
  readonly data: PageDataMap[T];
  readonly render: (props: IRenderContext) => string;

  #html = '';

  constructor(options: PageOptions<T>) {
    super();
    this.type = options.type;
    this.pathname = options.pathname;
    this.title = options.title;
    this.data = options.data;
    this.render = options.render;
  }

  get html(): string {
    return this.#html;
  }

  set html(value: string) {
    this.#html = value;
  }

  toAsset(): { path: string; content: Buffer } {
    return {
      path: normalize(this.pathname, 'index.html'),
      content: Buffer.from(this.#html),
    };
  }
}
