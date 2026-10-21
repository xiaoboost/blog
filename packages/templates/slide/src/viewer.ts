import { ModuleLoader } from '@blog/context/web';
import { SlideWidth } from '@blog/mdx-slide/shared';
import { getCurrentScriptSrc } from '@blog/web';
import loadingStyles from './loading/index.jss';
import styles from './presentation/index.jss';
import toolbarStyles from './toolbar/index.jss';
import { waitForSlideConfig } from './wait-for-slide-config';

/** 等当前页图片解码和字体就绪；资源失败或超时不阻塞浏览。 */
async function waitForPage(section: HTMLElement, signal: AbortSignal) {
  const images = Array.from(section.querySelectorAll('img'));
  const resources = Promise.allSettled([
    document.fonts.ready,
    ...images.map((image) => {
      image.loading = 'eager';
      return image.decode().catch(() => {
        // 背景图保留底色，普通图片保留作者提供的 alt。
        if (!image.alt) {
          image.style.visibility = 'hidden';
        }
      });
    }),
  ]);
  let timer = 0;
  let release = () => {};
  const timeout = new Promise<void>((resolve) => {
    release = resolve;
    timer = window.setTimeout(resolve, 8000);
    signal.addEventListener('abort', release, { once: true });
  });

  await Promise.race([resources, timeout]);
  window.clearTimeout(timer);
  signal.removeEventListener('abort', release);
}

function active() {
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
  totalPages.textContent = String(sections.length).padStart(2, '0');
  const events = new AbortController();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pending: AbortController | undefined;
  let revealAnimations: Animation[] = [];
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

  function finishReveal() {
    loading.style.visibility = 'hidden';
    revealAnimations.forEach((animation) => {
      animation.onfinish = null;
      animation.cancel();
    });
    revealAnimations = [];
  }

  function resize() {
    canvas.style.transform = `scale(${card.clientWidth / SlideWidth})`;
  }

  async function show(index: number) {
    if (index < 0 || index >= sections.length) {
      return;
    }

    pending?.abort();
    finishReveal();
    const request = new AbortController();
    let loadingShown = false;
    pending = request;
    page = index;
    currentPage.textContent = String(page + 1).padStart(2, '0');
    card.setAttribute('aria-busy', 'true');
    canvas.style.visibility = 'hidden';
    window.clearTimeout(loadingTimer);
    loadingTimer = window.setTimeout(() => {
      loadingShown = true;
      loading.style.visibility = 'visible';
    }, 200);

    sections.forEach((section, i) => {
      section.hidden = i !== page;
      section.style.display = i === page ? 'block' : 'none';
    });
    await Promise.all([
      configReady,
      waitForPage(sections[page], request.signal),
    ]);

    if (request.signal.aborted || events.signal.aborted) {
      return;
    }

    window.clearTimeout(loadingTimer);
    loadingError.hidden = !configFailed;
    canvas.style.visibility = 'visible';

    if (loadingShown && !reducedMotion.matches) {
      const fadeOut = loading.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration: 120, easing: 'ease-out', fill: 'forwards' },
      );
      const fadeIn = canvas.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: 180, easing: 'ease-out' },
      );
      revealAnimations = [fadeOut, fadeIn];
      fadeOut.onfinish = () => {
        if (!request.signal.aborted && !events.signal.aborted) {
          loading.style.visibility = 'hidden';
        }
      };
      fadeIn.onfinish = () => {
        if (!request.signal.aborted && !events.signal.aborted) {
          finishReveal();
        }
      };
    }
    else {
      finishReveal();
    }

    card.setAttribute('aria-busy', 'false');
    ready = true;

    // 顺便解码下一页，切页时更容易命中缓存。
    sections[page + 1]?.querySelectorAll('img').forEach((image) => {
      image.loading = 'eager';
      void image.decode().catch(() => {});
    });
  }

  const options = { signal: events.signal };
  const spinnerAnimation = spinner.animate(
    [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
    { duration: 900, iterations: Infinity },
  );
  const updateSpinnerMotion = () => {
    if (reducedMotion.matches) {
      spinnerAnimation.pause();

      if (revealAnimations.length) {
        finishReveal();
      }
    }
    else {
      spinnerAnimation.play();
    }
  };
  reducedMotion.addEventListener('change', updateSpinnerMotion, options);
  updateSpinnerMotion();

  const interactive = (target: EventTarget | null) => target instanceof Element
    && !!target.closest('a, button, input, textarea, select, [contenteditable="true"]');

  card.addEventListener('click', (event) => {
    if (
      !ready
      || interactive(event.target)
      || toolbar.contains(event.target as Node)
      || loadingError.contains(event.target as Node)
      || window.getSelection()?.toString()
    ) {
      return;
    }

    card.focus({ preventScroll: true });
    void show(page + 1);
  }, options);
  document.addEventListener('keydown', (event) => {
    if (!ready || interactive(event.target) || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;

    if (direction) {
      event.preventDefault();
      void show(page + direction);
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

  const observer = new ResizeObserver(resize);
  observer.observe(card);
  resize();
  void show(0);

  return () => {
    events.abort();
    pending?.abort();
    finishReveal();
    spinnerAnimation.cancel();
    observer.disconnect();
    window.clearTimeout(loadingTimer);
  };
}

if (process.env.NODE_ENV === 'development' && ModuleLoader) {
  ModuleLoader.install({ currentScript: getCurrentScriptSrc(), active });
}
else {
  active();
}
