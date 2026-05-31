import type { ISite } from '@blog/types';
import { ResourceSet } from './resource-set';

export interface SiteOptions {
  title: string;
  publicPath: string;
  author?: string;
  description?: string;
  aboutPath: string;
  tagPath: string;
  archivePath: string;
}

export class Site extends ResourceSet implements ISite {
  readonly title: string;
  readonly publicPath: string;
  readonly author?: string;
  readonly description?: string;
  readonly aboutPath: string;
  readonly tagPath: string;
  readonly archivePath: string;

  constructor(options: SiteOptions) {
    super();
    this.title = options.title;
    this.publicPath = options.publicPath;
    this.author = options.author;
    this.description = options.description;
    this.aboutPath = options.aboutPath;
    this.tagPath = options.tagPath;
    this.archivePath = options.archivePath;
  }
}
