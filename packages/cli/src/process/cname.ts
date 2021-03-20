import { site } from '../config/website';
import { push } from './files';

import { join } from 'path';
import { outputDir } from '../config/project';

export function cname() {
  push({
    path: join(outputDir, 'CNAME'),
    contents: site.cname,
  });
}
