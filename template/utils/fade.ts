import { delay } from '@xiao-ai/utils';

export async function fadeIn(el: HTMLElement, time: number) {
  // 已经显示，则推出
  if (el.style.display === 'block') {
    return;
  }

  el.style.display = 'block';
  el.style.opacity = '0';
  await delay();
  el.style.opacity = '1';
  el.style.transition = `opacity ${time}ms linear`;
}

export async function fadeOut(el: HTMLElement, time: number) {
  // 跳过已经隐身状态
  if (el.style.display === 'none') {
    return;
  }

  // display 不存在，表示是初始状态
  if (!el.style.display) {
    el.style.display = 'none';
    return;
  }

  el.style.display = 'block';
  el.style.opacity = '1';
  await delay();
  el.style.opacity = '0';
  el.style.transition = `opacity ${time}ms linear`;
  await delay(time);
  el.style.display = 'none';
}
