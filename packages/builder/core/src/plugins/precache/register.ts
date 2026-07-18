declare const __SW_PATH__: string;
declare const __CONTENT_UPDATED__: string;

navigator.serviceWorker?.register(__SW_PATH__);
navigator.serviceWorker?.addEventListener('message', (event) => {
  if (event.data === __CONTENT_UPDATED__) {
    location.reload();
  }
});
