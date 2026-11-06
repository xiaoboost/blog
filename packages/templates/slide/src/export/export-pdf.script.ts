import { assets, setScriptExports } from '@blog/context/web';
import { exportPdf } from './pdf';
import type { SlideExportModule } from './types';

setScriptExports<SlideExportModule>({
  exportPpt: exportPdf,
});

export default assets;
