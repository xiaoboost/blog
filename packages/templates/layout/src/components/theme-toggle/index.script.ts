import { ModuleLoader } from '@blog/context/web';
import { getCurrentScriptSrc } from '@blog/web';

import styles from './index.jss';
import { getNextThemeMode, getThemeMode, getThemeTitle, ThemeStorageKey, type ThemeMode } from './theme';

function active() {
  const button = document.querySelector<HTMLButtonElement>(`.${styles.classes.toggle}`);

  if (!button) {
    return () => {};
  }

  const root = document.documentElement;

  const applyMode = (mode: ThemeMode) => {
    if (mode === 'auto') {
      delete root.dataset.theme;
    }
    else {
      root.dataset.theme = mode;
    }

    const title = getThemeTitle(mode);
    button.title = title;
    button.setAttribute('aria-label', title);
  };

  const cycleMode = () => {
    const mode = getNextThemeMode(getThemeMode(root.dataset.theme));
    applyMode(mode);

    try {
      if (mode === 'auto') {
        localStorage.removeItem(ThemeStorageKey);
      }
      else {
        localStorage.setItem(ThemeStorageKey, mode);
      }
    }
    catch {
      // 存储不可用时，本页仍能正常切换。
    }
  };

  const syncMode = (event: StorageEvent) => {
    if (event.key === ThemeStorageKey || event.key === null) {
      applyMode(getThemeMode(event.newValue));
    }
  };

  applyMode(getThemeMode(root.dataset.theme));
  button.disabled = false;
  button.addEventListener('click', cycleMode);
  window.addEventListener('storage', syncMode);

  return () => {
    button.disabled = true;
    button.removeEventListener('click', cycleMode);
    window.removeEventListener('storage', syncMode);
  };
}

if (process.env.NODE_ENV === 'development' && ModuleLoader) {
  ModuleLoader.install({
    currentScript: getCurrentScriptSrc(),
    active,
  });
}
else {
  active();
}
