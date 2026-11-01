import { SlideWidth } from '@blog/mdx-slide/shared';
import loadingStyles from '../loading/index.jss';
import styles from '../presentation/index.jss';
import toolbarStyles from '../toolbar/index.jss';
import { createPlayerAnimations } from './animations';
import { bindPlayerControls } from './controls';
import { waitForPage } from './wait-for-page';
import { waitForSlideConfig } from './wait-for-slide-config';

export function active() {
  const find = <T extends HTMLElement>(name: string) => document.querySelector<T>(`.${name}`)!;
  const presentation = find<HTMLElement>(styles.classes.presentation);

  if (!presentation) {
    return () => {};
  }

  const card = find<HTMLElement>(styles.classes.card);
  const canvas = find<HTMLElement>(styles.classes.canvas);
  const toolbar = find<HTMLElement>(toolbarStyles.classes.toolbar);
  const currentPage = find<HTMLElement>(toolbarStyles.classes.currentPage);
  const totalPages = find<HTMLElement>(toolbarStyles.classes.totalPages);
  const play = find<HTMLButtonElement>(toolbarStyles.classes.play);
  const loading = find<HTMLElement>(loadingStyles.classes.loading);
  const spinner = find<HTMLElement>(loadingStyles.classes.spinner);
  const loadingError = find<HTMLElement>(loadingStyles.classes.error);
  const retry = find<HTMLButtonElement>(loadingStyles.classes.retry);
  const sections = Array.from(canvas.querySelectorAll<HTMLElement>('[data-slide-section]'));
  const pageStorageKey = `slide:page:${window.location.pathname}`;

  if (totalPages) {
    totalPages.textContent = String(sections.length).padStart(2, '0');
  }

  const events = new AbortController();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const animations = createPlayerAnimations({
    canvas,
    loading,
    spinner,
    reducedMotion,
    signal: events.signal,
  });
  let pending: AbortController | undefined;
  let displayedPage = 0;
  let page = 0;
  let loadingTimer = 0;
  let ready = false;
  let configFailed = false;
  loadingError.hidden = true;
  const configReady = waitForSlideConfig(events.signal)
    .then((config) => {
      if (config.sections.length !== sections.length) {
        throw new Error('幻灯片动画配置与页面数量不一致。');
      }

      return config;
    })
    .catch((error: unknown) => {
      if (!events.signal.aborted) {
        configFailed = true;
        console.error('[slide] 动画配置加载失败。', error);
      }
    });

  function resize() {
    canvas.style.transform = `scale(${card.clientWidth / SlideWidth})`;
  }

  async function show(index: number) {
    if (index < 0 || index >= sections.length || (ready && index === page)) {
      return;
    }

    pending?.abort();
    animations.finishPageTransition();
    animations.finishReveal();
    const request = new AbortController();
    let loadingShown = false;
    pending = request;
    page = index;

    card.setAttribute('aria-busy', 'true');
    // 下一页就绪前保留当前内容，缓存命中时避免空白闪烁。
    canvas.style.visibility = ready ? 'visible' : 'hidden';
    window.clearTimeout(loadingTimer);
    loadingTimer = window.setTimeout(() => {
      loadingShown = true;
      canvas.style.visibility = 'hidden';
      loading.style.visibility = 'visible';
    }, 200);

    await Promise.all([
      configReady,
      waitForPage(sections[index], request.signal),
    ]);

    if (request.signal.aborted || events.signal.aborted) {
      return;
    }

    window.clearTimeout(loadingTimer);
    const previous = sections[displayedPage];
    const direction = Math.sign(index - displayedPage);
    sections.forEach((section, i) => {
      section.hidden = i !== index;
      section.style.display = i === index ? 'block' : 'none';
    });
    displayedPage = index;

    if (currentPage) {
      currentPage.textContent = String(index + 1).padStart(2, '0');
    }

    loadingError.hidden = !configFailed;
    canvas.style.visibility = 'visible';

    if (ready && direction && !loadingShown && !reducedMotion.matches) {
      animations.finishReveal();
      animations.transition(previous, sections[index], direction);
    }
    else if (loadingShown && !reducedMotion.matches) {
      animations.reveal(request.signal);
    }
    else {
      animations.finishReveal();
    }

    card.setAttribute('aria-busy', 'false');
    ready = true;

    if (process.env.NODE_ENV === 'development') {
      try {
        window.sessionStorage.setItem(pageStorageKey, String(index));
      }
      catch {
        // 浏览器禁用存储时，仍然可以正常翻页。
      }
    }

    // 顺便解码下一页，切页时更容易命中缓存。
    sections[page + 1]?.querySelectorAll('img').forEach((image) => {
      image.loading = 'eager';
      void image.decode().catch(() => {});
    });
  }

  bindPlayerControls({
    presentation,
    card,
    toolbar,
    loadingError,
    retry,
    play,
    signal: events.signal,
    isReady: () => ready,
    navigate: (direction) => {
      void show(page + direction);
    },
    resize,
  });

  const observer = new ResizeObserver(resize);
  observer.observe(card);
  resize();
  let initialPage = 0;

  if (process.env.NODE_ENV === 'development') {
    try {
      const savedPage = Number(window.sessionStorage.getItem(pageStorageKey));

      if (Number.isSafeInteger(savedPage) && savedPage >= 0) {
        initialPage = Math.min(savedPage, Math.max(0, sections.length - 1));
      }
    }
    catch {
      // 浏览器禁用存储时，从第一页开始播放。
    }
  }

  void show(initialPage);

  return () => {
    events.abort();
    pending?.abort();
    animations.destroy();
    observer.disconnect();
    window.clearTimeout(loadingTimer);
  };
}
