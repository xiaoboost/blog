import { site } from '../config/website';
import { push } from './files';

export function cname() {
  push({
    path: 'CNAME',
    content: site.cname,
  });
}
