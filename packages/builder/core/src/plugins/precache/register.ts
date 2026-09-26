import { messages } from './policy';
import { declaredResource, pageUrl } from './resources';

declare const __SW_PATH__: string;

const serviceWorker = navigator.serviceWorker;
let reloading = false;

serviceWorker?.addEventListener('message', (event) => {
  if (
    event.data?.type === messages.updated
    && event.data.url === pageUrl(location.href)
    && !reloading
  ) {
    // 后台更新与页面就绪检查可能都发出通知，一次加载只触发一次刷新。
    reloading = true;
    location.reload();
  }
});

async function ready() {
  if (!serviceWorker) return;
  const registration = await serviceWorker.ready;
  const resources = new Set<string>();
  // 报告当前 DOM 实际声明的资源，不能用缓存中新 HTML 的引用代替旧窗口的引用。
  for (const element of document.querySelectorAll('script[src], link[href]')) {
    const attrs = new Map(
      [...element.attributes].map(({ name, value }) => [name.toLowerCase(), value]),
    );
    const resource = declaredResource(element.tagName, attrs, document.baseURI);
    if (resource) resources.add(resource);
  }
  // 首次安装时当前页可能还没有 controller，仍可通知已激活的 SW 预热当前文章。
  (serviceWorker.controller ?? registration.active)?.postMessage({
    type: messages.ready,
    url: pageUrl(location.href),
    resources: [...resources],
  });
}

serviceWorker?.startMessages();
serviceWorker?.register(__SW_PATH__).catch((error) => console.warn('[precache] Registration failed', error));
window.addEventListener('pageshow', () => {
  // 加载完成和从浏览器前进/后退缓存恢复时都报告，补上首次安装、慢加载等情况。
  void ready().catch((error) => console.warn('[precache] Page registration failed', error));
});
