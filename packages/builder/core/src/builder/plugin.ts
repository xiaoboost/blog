import { BundlerPlugin } from '../plugins/bundler';
import type { Builder } from './builder';

export function applyPlugin(builder: Builder) {
  BundlerPlugin.apply(builder);
}
