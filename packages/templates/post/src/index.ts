import { defineUtils } from '@blog/context/runtime';
import assets from './post.script';
import './font';

export { Post, PostProps } from './post';
export const utils = defineUtils(assets);
