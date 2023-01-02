import { ModuleLoader } from '@blog/context/web';
import { getCurrentScriptSrc } from '@blog/web';

import styles from './index.jss';

import { ScrollBar } from './scrollbar';

function active() {
  const scrollBars = Array.from(document.querySelectorAll(`.${styles.classes.scrollbar}`)).map(
    (el) => new ScrollBar(el as HTMLElement),
  );

  return () => {
    scrollBars.forEach((bar) => bar.disable());
  };
}

if (process.env.NODE_ENV === 'development') {
  ModuleLoader.install({
    currentScript: getCurrentScriptSrc(),
    active,
  });
} else {
  active();
}
