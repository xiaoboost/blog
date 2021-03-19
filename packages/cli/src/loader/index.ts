export * from './base';
export * from './image';
export * from './post';
export * from './style';
export * from './script';
export * from './copy';
export * from './page';

import * as project from 'src/config/project';

import { PostLoader } from './post';
import { CopyLoader } from './copy';
import { PageLoader } from './page';
import { CnameLoader } from './cname';

// 构建
CopyLoader.Create([project.assetsPath]);
PostLoader.LoadPosts();
PageLoader.Create();

if (process.env.NODE_ENV === 'production') {
  CnameLoader.Create();
}
