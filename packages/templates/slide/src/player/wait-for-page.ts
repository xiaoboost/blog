/** 等当前页图片解码和字体就绪；资源失败或超时不阻塞浏览。 */
export async function waitForPage(section: HTMLElement, signal: AbortSignal) {
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
