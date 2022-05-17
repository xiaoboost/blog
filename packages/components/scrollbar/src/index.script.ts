import styles from './index.jss';

import { ScrollBar } from './scrollbar';

Array.from(document.querySelectorAll(`.${styles.classes.scrollbar}`)).forEach((el) => {
  new ScrollBar(el as HTMLElement);
});
