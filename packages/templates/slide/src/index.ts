import { defineUtils } from '@blog/context/runtime';
import { SlideExportScript } from './export/constant';
import exportAssets from './export/export-pdf.script';
import assets from './slide.script';
import './font';

export { SlidePage } from './slide';

export const utils = defineUtils(assets, {
  browserConfig: {
    lazyScripts: {
      [SlideExportScript]: exportAssets,
    },
  },
});
