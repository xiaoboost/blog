import { assets, getGlobalContext, GlobalKey } from '@blog/context/web';
import { getCurrentScriptSrc } from '@blog/web';

import { getNextThemeMode, getThemeMode, getThemeTitle, ThemeStorageKey, type ThemeMode } from './theme';

// 在 head 中同步恢复偏好，随后加载的 CSS 会直接使用正确的主题。
try {
  const mode = getThemeMode(localStorage.getItem(ThemeStorageKey));
  if (mode === 'auto') {
    delete document.documentElement.dataset.theme;
  }
  else {
    document.documentElement.dataset.theme = mode;
  }
}
catch {
  // 存储不可用时由 CSS 跟随系统主题。
}

// DOMContentLoaded 回调执行时 currentScript 已经为空，先记录资源路径。
const currentScript = process.env.NODE_ENV === 'development' ? getCurrentScriptSrc() : '';

function active() {
  const button = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');

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

function initialize() {
  if (process.env.NODE_ENV === 'development') {
    // head 中的主题脚本先于 HMR 客户端执行，待 DOM 就绪后再读取加载器。
    const moduleLoader = getGlobalContext()[GlobalKey.ModuleLoader];
    if (moduleLoader) {
      moduleLoader.install({ currentScript, active });
      return;
    }
  }
  active();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize, { once: true });
}
else {
  initialize();
}

export default assets;
