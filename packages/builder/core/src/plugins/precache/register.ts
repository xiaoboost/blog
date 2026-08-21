declare const __SW_PATH__: string;
declare const __CONTENT_UPDATED__: string;

const serviceWorker = navigator.serviceWorker;

serviceWorker?.addEventListener('message', (event) => {
  if (event.data === __CONTENT_UPDATED__) {
    location.reload();
  }
});

serviceWorker?.startMessages();
serviceWorker?.register(__SW_PATH__);
