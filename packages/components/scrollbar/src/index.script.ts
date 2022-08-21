import styles from './index.jss';

import { ScrollBar } from './scrollbar';
import { getCurrentScriptSrc } from '@blog/shared/web';

function active() {
  const scrollBars = Array.from(document.querySelectorAll(`.${styles.classes.scrollbar}`)).map(
    (el) => new ScrollBar(el as HTMLElement),
  );

  return () => {
    scrollBars.forEach((bar) => bar.disable());
  };
}

if (process.env.NODE_ENV === 'development' && window.Module) {
  window.Module.install({
    currentScript: getCurrentScriptSrc(),
    active,
  });
} else {
  active();
}
