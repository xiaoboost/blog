import type { Builder } from './builder';

import { LoggerPlugin } from '../plugins/logger';
import { LocalPackagePlugin } from '../plugins/loader-local-package';

export function applyPlugin(builder: Builder) {
  LoggerPlugin().apply(builder);
  LocalPackagePlugin().apply(builder);
}
