import { FontBucket } from '@blog/node';
import { SiteTitleFontFamily, ListTitleFontFamily, ListItemTitleFontFamily } from './font';
import SiteTitleFontFile from '../assets/font/dancing/dancing.ttf?raw';
import ListTitleFontFile from '../assets/font/SourceHanSerif/SourceHanSerifSC-Bold.otf?raw';
import ListItemTitleFontFile from '../assets/font/SourceHanSerif/SourceHanSerifSC-SemiBold.otf?raw';

/**
 * 网站标题字体
 *
 * @description 手写字体，字重 400
 */
export const SiteTitleFontBucket = new FontBucket({
  fontContent: SiteTitleFontFile,
  fontFamily: SiteTitleFontFamily,
});

/**
 * 列表标题字体
 *
 * @description 思源宋体，字重 700
 */
export const ListTitleFontBucket = new FontBucket({
  fontContent: ListTitleFontFile,
  fontFamily: ListTitleFontFamily,
});

/**
 * 列表项标题字体
 *
 * @description 思源宋体，字重 600
 */
export const ListItemTitleFontBucket = new FontBucket({
  fontContent: ListItemTitleFontFile,
  fontFamily: ListItemTitleFontFamily,
});
