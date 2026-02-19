import { FontBucket } from '@blog/node';
import TitleFontFile from '../assets/font/dancing/dancing.ttf?raw';
import { TitleFontFamily } from './font';

export const titleFontBucket = new FontBucket({
  fontContent: TitleFontFile,
  cssPath: './styles/dancing.css',
  fontPath: './fonts/dancing.woff2',
  fontFamily: TitleFontFamily,
});
