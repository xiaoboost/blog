import { SlideWidth, SlideHeight } from '@blog/mdx-slide/shared';

/** 在屏幕外逐页准备副本，不改变播放器正在展示的页面。 */
export function createExportFrame(canvas: HTMLElement, section: HTMLElement) {
  const frame = canvas.cloneNode(false) as HTMLElement;
  const computed = getComputedStyle(canvas);
  frame.removeAttribute('id');
  frame.setAttribute('aria-hidden', 'true');
  frame.inert = true;
  Object.assign(frame.style, {
    position: 'fixed',
    left: '-100000px',
    top: '0',
    width: `${SlideWidth}px`,
    height: `${SlideHeight}px`,
    transform: 'none',
    visibility: 'visible',
    overflow: 'hidden',
    pointerEvents: 'none',
    font: computed.font,
    color: computed.color,
    backgroundColor: getComputedStyle(canvas.parentElement!).backgroundColor,
  });

  const copy = section.cloneNode(true) as HTMLElement;
  copy.hidden = false;
  Object.assign(copy.style, {
    display: 'block',
    position: 'relative',
    left: '0',
    top: '0',
  });
  let content = copy;
  let parent = section.parentElement;
  while (parent && parent !== canvas) {
    const wrapper = parent.cloneNode(false) as HTMLElement;
    wrapper.append(content);
    content = wrapper;
    parent = parent.parentElement;
  }
  frame.append(content);
  document.body.append(frame);

  try {
    const originals = section.querySelectorAll('canvas');
    copy.querySelectorAll('canvas').forEach((target, index) => {
      target.getContext('2d')!.drawImage(originals[index], 0, 0);
    });
    frame.querySelectorAll('[data-export-ignore]').forEach((element) => element.remove());
    frame.querySelectorAll<HTMLElement>('*').forEach((element) => {
      element.style.animation = 'none';
      element.style.transition = 'none';
    });
    frame.querySelectorAll('img').forEach((image) => {
      image.loading = 'eager';
    });
    return frame;
  }
  catch (error) {
    frame.remove();
    throw error;
  }
}

export async function waitForExportFrame(frame: HTMLElement, signal: AbortSignal) {
  signal.throwIfAborted();
  let timeout: ReturnType<typeof setTimeout>;
  let abort: () => void;
  const interrupted = new Promise<never>((_, reject) => {
    abort = () => reject(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
    timeout = setTimeout(() => reject(new Error('等待字体或图片加载超时。')), 30_000);
  });
  try {
    await Promise.race([
      Promise.all([document.fonts.ready, ...Array.from(frame.querySelectorAll('img'), (image) => image.decode())]),
      interrupted,
    ]);
    signal.throwIfAborted();
  }
  finally {
    clearTimeout(timeout!);
    signal.removeEventListener('abort', abort!);
  }
}
