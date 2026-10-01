import { ThemeStorageKey } from './theme';

/** 仅供 HTML 模板使用：在样式加载前恢复手动偏好；无偏好时由 CSS 跟随系统。 */
export const themeInitScript = `try{const theme=localStorage.getItem(${JSON.stringify(ThemeStorageKey)});if(theme==="light"||theme==="dark")document.documentElement.dataset.theme=theme;}catch{}`;
