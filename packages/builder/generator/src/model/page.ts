import { normalize } from '@blog/node';
import type {
  IRenderContext,
  PageDataMap,
  PageType,
} from '@blog/types';
import { ResourceSet } from './resource-set';

export interface PageOptions<T extends PageType = PageType> {
  type: T;
  pathname: string;
  outputPath?: string;
  title: string;
  data: PageDataMap[NoInfer<T>];
  render: (props: IRenderContext<NoInfer<T>>) => string;
}

export class Page<T extends PageType> extends ResourceSet {
  readonly type: T;
  readonly pathname: string;
  readonly outputPath: string;
  readonly title: string;
  readonly data: PageDataMap[T];
  readonly render: (props: IRenderContext<T>) => string;

  #html = '';

  constructor(options: PageOptions<T>) {
    super();
    this.type = options.type;
    this.pathname = options.pathname;
    this.outputPath = normalize('/', options.outputPath ?? normalize(options.pathname, 'index.html'));
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
      path: this.outputPath,
      content: Buffer.from(this.#html),
    };
  }
}
