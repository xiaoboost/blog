interface SwipeOptions {
  signal: AbortSignal;
  canStart: (event: PointerEvent) => boolean;
  onSwipe: (direction: -1 | 1) => void;
}

/** 鼠标、触屏共用横滑识别；纵向滚动和缩放交给 touch-action。 */
export function bindSwipe(element: HTMLElement, { signal, canStart, onSwipe }: SwipeOptions) {
  let gesture: {
    id: number;
    x: number;
    y: number;
    horizontal: boolean;
    rejected: boolean;
    moved: boolean;
  } | undefined;
  let suppressClickUntil = 0;
  const options = { signal };
  const document = element.ownerDocument;
  const cancel = () => {
    if (gesture?.moved) {
      suppressClickUntil = Date.now() + 700;
    }

    gesture = undefined;
  };

  element.addEventListener('pointerdown', (event) => {
    if (gesture && gesture.id !== event.pointerId) {
      cancel();
      return;
    }

    if (!event.isPrimary || event.button !== 0) {
      return;
    }

    suppressClickUntil = 0;

    if (!canStart(event)) {
      return;
    }

    gesture = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      horizontal: false,
      rejected: false,
      moved: false,
    };
  }, options);

  // 第二根手指即使落在容器外也取消；拖出卡片后仍能收到松手事件。
  document.addEventListener('pointerdown', (event) => {
    if (gesture && gesture.id !== event.pointerId) {
      cancel();
    }
  }, { signal, capture: true });
  document.addEventListener('pointermove', (event) => {
    if (!gesture || gesture.id !== event.pointerId) {
      return;
    }

    if (event.pointerType === 'mouse' && !(event.buttons & 1)) {
      cancel();
      return;
    }

    const dx = Math.abs(event.clientX - gesture.x);
    const dy = Math.abs(event.clientY - gesture.y);
    gesture.moved ||= Math.max(dx, dy) >= 12;

    if (!gesture.moved || gesture.rejected) {
      return;
    }

    if (!gesture.horizontal) {
      if (dx < dy * 1.5) {
        gesture.rejected = true;
        return;
      }

      gesture.horizontal = true;
    }

    if (event.cancelable) {
      event.preventDefault();
    }
  }, { signal, passive: false });
  document.addEventListener('pointerup', (event) => {
    if (!gesture || gesture.id !== event.pointerId) {
      return;
    }

    const current = gesture;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    current.moved ||= Math.max(Math.abs(dx), Math.abs(dy)) >= 12;
    cancel();

    if (!current.rejected && Math.abs(dx) >= 40 && Math.abs(dx) >= Math.abs(dy) * 1.5) {
      onSwipe(dx < 0 ? 1 : -1);
    }
  }, options);
  document.addEventListener('pointercancel', (event) => {
    if (gesture?.id === event.pointerId) {
      cancel();
    }
  }, options);
  document.defaultView?.addEventListener('blur', cancel, options);
  for (const type of ['dragstart', 'selectstart']) {
    element.addEventListener(type, (event) => {
      if (gesture) {
        event.preventDefault();
      }
    }, options);
  }
  element.addEventListener('click', (event) => {
    if (event.detail > 0 && Date.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, { signal, capture: true });
}
