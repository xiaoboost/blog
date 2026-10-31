interface SwipeOptions {
  signal: AbortSignal;
  canStart: (target: EventTarget | null) => boolean;
  onSwipe: (direction: -1 | 1) => void;
}

/** 在普通视图和全屏共用的容器上识别单指横滑，保留纵向滚动和双指缩放。 */
export function bindSwipe(element: HTMLElement, { signal, canStart, onSwipe }: SwipeOptions) {
  let gesture: { id: number; x: number; y: number; horizontal: boolean } | undefined;
  let suppressClickUntil = 0;
  const options = { signal, passive: true };

  element.addEventListener('touchstart', (event) => {
    gesture = undefined;
    suppressClickUntil = 0;

    if (event.touches.length !== 1 || !canStart(event.target)) {
      return;
    }

    const touch = event.touches[0];
    gesture = {
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      horizontal: false,
    };
  }, options);

  element.addEventListener('touchmove', (event) => {
    if (!gesture) {
      return;
    }

    const touch = event.touches[0];

    if (event.touches.length !== 1 || touch.identifier !== gesture.id) {
      gesture = undefined;
      return;
    }

    const dx = Math.abs(touch.clientX - gesture.x);
    const dy = Math.abs(touch.clientY - gesture.y);

    if (!gesture.horizontal) {
      if (Math.max(dx, dy) < 12) {
        return;
      }

      if (dx < dy * 1.5) {
        gesture = undefined;
        return;
      }

      gesture.horizontal = true;
    }

    // 仅横滑阻止浏览器默认行为，也避免松手后触发点击翻页。
    if (event.cancelable) {
      event.preventDefault();
    }
  }, { signal, passive: false });

  element.addEventListener('touchend', (event) => {
    const current = gesture;
    gesture = undefined;

    if (!current || event.touches.length) {
      return;
    }

    const touch = Array.from(event.changedTouches)
      .find(({ identifier }) => identifier === current.id);

    if (!touch) {
      return;
    }

    const dx = touch.clientX - current.x;
    const dy = touch.clientY - current.y;

    if (current.horizontal || Math.max(Math.abs(dx), Math.abs(dy)) >= 12) {
      suppressClickUntil = Date.now() + 700;
    }

    if (Math.abs(dx) >= 40 && Math.abs(dx) >= Math.abs(dy) * 1.5) {
      onSwipe(dx < 0 ? 1 : -1);
    }
  }, options);

  element.addEventListener('touchcancel', () => {
    gesture = undefined;
  }, options);

  element.addEventListener('click', (event) => {
    if (event.detail > 0 && Date.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, { signal, capture: true });
}
