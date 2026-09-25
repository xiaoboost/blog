export type ThemeMode = 'auto' | 'light' | 'dark';

export const ThemeStorageKey = 'blog-theme';

const nextMode: Record<ThemeMode, ThemeMode> = {
  auto: 'light',
  light: 'dark',
  dark: 'auto',
};

const modeLabel: Record<ThemeMode, string> = {
  auto: '跟随系统',
  light: '亮色模式',
  dark: '暗色模式',
};

export function getThemeMode(value: string | null | undefined): ThemeMode {
  return value === 'light' || value === 'dark' ? value : 'auto';
}

export function getNextThemeMode(mode: ThemeMode): ThemeMode {
  return nextMode[mode];
}

export function getThemeTitle(mode: ThemeMode): string {
  return `当前：${modeLabel[mode]}；点击切换${modeLabel[nextMode[mode]]}`;
}

/** 在样式加载前恢复手动偏好；无偏好时由 CSS 跟随系统。 */
export const themeInitScript = `try{const theme=localStorage.getItem(${JSON.stringify(ThemeStorageKey)});if(theme==="light"||theme==="dark")document.documentElement.dataset.theme=theme;}catch{}`;
