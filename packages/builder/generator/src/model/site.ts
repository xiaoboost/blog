import type { ISite } from '@blog/types';
import { ResourceSet } from './resource-set';

export interface SiteOptions {
  title: string;
  origin: string;
  publicPath: string;
  author?: string;
  authorUrl?: string;
  description?: string;
  aboutPath: string;
  tagPath: string;
  archivePath: string;
}

export class Site extends ResourceSet implements ISite {
  readonly title: string;
  readonly origin: string;
  readonly publicPath: string;
  readonly author?: string;
  readonly authorUrl?: string;
  readonly description?: string;
  readonly aboutPath: string;
  readonly tagPath: string;
  readonly archivePath: string;

  constructor(options: SiteOptions) {
    super();
    this.title = options.title;
    this.origin = options.origin;
    this.publicPath = options.publicPath;
    this.author = options.author;
    this.authorUrl = options.authorUrl;
    this.description = options.description;
    this.aboutPath = options.aboutPath;
    this.tagPath = options.tagPath;
    this.archivePath = options.archivePath;
  }
}
