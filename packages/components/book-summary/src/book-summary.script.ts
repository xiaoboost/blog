import './index.jss';
import { ModuleLoader, assets } from '@blog/context/web';
import { getCurrentScriptSrc } from '@blog/web';

decodeURI;

function active() {
  // ..

  return () => {
    // ..
  };
}

if (process.env.NODE_ENV === 'development' && ModuleLoader) {
  ModuleLoader.install({
    currentScript: getCurrentScriptSrc(),
    active,
  });
} else {
  active();
}

export default assets;
