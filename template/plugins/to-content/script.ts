import { elementId } from "./constant";

(() => {
  const btn = document.body.querySelector<HTMLElement>(`#${elementId}`);

  if (!btn) {
    return;
  }

  console.log('含有目录');
})();
