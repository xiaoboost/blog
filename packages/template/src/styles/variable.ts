export function createScrollbarStyle(selector: string, width: number) {
  return {
    [`${selector}::-webkit-scrollbar`]: {
      width,
      height: width,
    },
    [`${selector}::-webkit-scrollbar-track`]: {
      boxShadow: ['inset', 0, 0, (width / 2), 'rgba(0, 0, 0, 0.3)'],
    },
    [`${selector}::-webkit-scrollbar-thumb`]: {
      boxShadow: ['inset', 0, 0, (width / 2), 'rgba(0, 0, 0, 0.3)'],
    },
  };
}
