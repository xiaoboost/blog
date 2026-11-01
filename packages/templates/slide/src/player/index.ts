import { ModuleLoader } from '@blog/context/web';
import { getCurrentScriptSrc } from '@blog/web';
import { active } from './viewer';

if (process.env.NODE_ENV === 'development' && ModuleLoader) {
  ModuleLoader.install({ currentScript: getCurrentScriptSrc(), active });
}
else {
  active();
}
