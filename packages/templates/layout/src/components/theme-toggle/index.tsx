import { AutoMode, DarkMode, LightMode } from '@blog/icons';
import React from 'react';

import styles from './index.jss';
import { getThemeTitle } from './theme';

export function ThemeToggle() {
  const title = getThemeTitle('auto');

  return (
    <button
      type="button"
      className={styles.classes.toggle}
      data-theme-toggle
      title={title}
      aria-label={title}
      disabled
    >
      <AutoMode className={styles.classes.autoIcon} />
      <LightMode className={styles.classes.lightIcon} />
      <DarkMode className={styles.classes.darkIcon} />
    </button>
  );
}
