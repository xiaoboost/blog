import path from 'path';

import { lookItUpSync } from 'look-it-up';

let root = '';

export function getCoreRoot() {
  if (!root) {
    root = path.dirname(lookItUpSync('package.json', __dirname)!);
  }

  return root;
}
