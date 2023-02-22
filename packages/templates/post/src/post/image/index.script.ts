import mediumZoom from 'medium-zoom';
import { getCurrentScriptSrc } from '@blog/web';
import { ModuleLoader } from '@blog/context/web';

import styles from './index.jss';

function active() {
  const zoom = mediumZoom(`.${styles.classes.postImageBox} .${styles.classes.postImageInner}`, {
    margin: 4,
    background: 'rgba(0, 0, 0, 0.5)',
  });

  return () => {
    zoom.detach();
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
