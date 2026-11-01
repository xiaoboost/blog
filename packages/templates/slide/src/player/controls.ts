import { bindSwipe } from './swipe';

interface PlayerControlOptions {
  presentation: HTMLElement;
  card: HTMLElement;
  toolbar: HTMLElement;
  loadingError: HTMLElement;
  retry: HTMLButtonElement;
  play: HTMLButtonElement;
  signal: AbortSignal;
  isReady: () => boolean;
  navigate: (direction: -1 | 1) => void;
  resize: () => void;
}

/** 把点击、键盘、触摸和全屏操作绑定到播放器，共用实例的取消信号。 */
export function bindPlayerControls({
  presentation,
  card,
  toolbar,
  loadingError,
  retry,
  play,
  signal,
  isReady,
  navigate,
  resize,
}: PlayerControlOptions) {
  const options = { signal };
  const interactive = (target: EventTarget | null) => target instanceof Element
    && !!target.closest('a, button, input, textarea, select, [contenteditable="true"]');

  bindSwipe(presentation, {
    signal,
    canStart: (target) => isReady()
      && !interactive(target)
      && !toolbar.contains(target as Node)
      && !loadingError.contains(target as Node)
      && !window.getSelection()?.toString(),
    onSwipe: (direction) => {
      card.focus({ preventScroll: true });
      navigate(direction);
    },
  });

  card.addEventListener('click', (event) => {
    if (
      !isReady()
      || interactive(event.target)
      || toolbar.contains(event.target as Node)
      || loadingError.contains(event.target as Node)
      || window.getSelection()?.toString()
    ) {
      return;
    }

    card.focus({ preventScroll: true });
    navigate(1);
  }, options);
  document.addEventListener('keydown', (event) => {
    if (!isReady() || interactive(event.target) || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;

    if (direction) {
      event.preventDefault();
      navigate(direction);
    }
  }, options);
  retry.addEventListener('click', () => window.location.reload(), options);
  play.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement === presentation) {
        await document.exitFullscreen();
      }
      else {
        await presentation.requestFullscreen();
      }

      card.focus({ preventScroll: true });
    }
    catch {
      play.title = '浏览器未能进入全屏，可以继续在此翻页';
    }
  }, options);
  document.addEventListener('fullscreenchange', () => {
    const label = document.fullscreenElement === presentation ? '退出播放（Esc）' : '播放（全屏）';
    play.setAttribute('aria-label', label);
    play.title = label;
    resize();
  }, options);
}
