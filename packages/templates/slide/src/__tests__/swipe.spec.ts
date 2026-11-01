import { deepStrictEqual, strictEqual } from 'node:assert/strict';
import { getEventListeners } from 'node:events';
import { describe, it } from '@blog/test-toolkit';
import { bindSwipe } from '../player/swipe';

function setup(allowed = true) {
  const element = new EventTarget();
  const controller = new AbortController();
  const directions: number[] = [];
  bindSwipe(element as HTMLElement, {
    signal: controller.signal,
    canStart: () => allowed,
    onSwipe: (direction) => directions.push(direction),
  });
  const point = (x: number, y = 100, id = 1) => ({ identifier: id, clientX: x, clientY: y });
  const touch = (type: string, points: ReturnType<typeof point>[]) => {
    const event = new Event(type, { cancelable: true });
    Object.assign(event, {
      touches: type === 'touchend' ? [] : points,
      changedTouches: points,
    });
    element.dispatchEvent(event);
    return event;
  };
  const click = (detail = 1) => {
    const event = new Event('click', { cancelable: true });
    Object.assign(event, { detail });
    element.dispatchEvent(event);
    return event;
  };
  return {
    element,
    controller,
    directions,
    point,
    touch,
    click,
  };
}

describe('PPT 触摸翻页', () => {
  it('一次左滑或右滑只翻一页，并拦截松手后的合成点击', () => {
    const {
      directions,
      point,
      touch,
      click,
    } = setup();
    touch('touchstart', [point(200)]);
    strictEqual(touch('touchmove', [point(140)]).defaultPrevented, true);
    touch('touchmove', [point(100)]);
    touch('touchend', [point(80)]);
    strictEqual(click().defaultPrevented, true);
    deepStrictEqual(directions, [1]);

    touch('touchstart', [point(80)]);
    touch('touchmove', [point(140)]);
    touch('touchend', [point(200)]);
    deepStrictEqual(directions, [1, -1]);
  });

  it('轻点仍可点击，短横拖和滑回起点不翻页', () => {
    const {
      directions,
      point,
      touch,
      click,
    } = setup();
    touch('touchstart', [point(200)]);
    touch('touchmove', [point(180)]);
    touch('touchend', [point(180)]);
    strictEqual(click().defaultPrevented, true);

    touch('touchstart', [point(200)]);
    touch('touchmove', [point(100)]);
    touch('touchend', [point(195)]);
    strictEqual(click().defaultPrevented, true);

    touch('touchstart', [point(200)]);
    touch('touchend', [point(202)]);
    strictEqual(click().defaultPrevented, false);
    deepStrictEqual(directions, []);
  });

  it('纵向或斜向滚动不阻止默认行为，也不会中途变成翻页', () => {
    const { directions, point, touch } = setup();
    for (const x of [200, 170]) {
      touch('touchstart', [point(200)]);
      strictEqual(touch('touchmove', [point(x, 140)]).defaultPrevented, false);
      touch('touchmove', [point(50, 145)]);
      touch('touchend', [point(50, 145)]);
    }
    deepStrictEqual(directions, []);
  });

  it('双指手势、系统取消和触点变化都不翻页', () => {
    const { directions, point, touch } = setup();
    touch('touchstart', [point(200)]);
    touch('touchmove', [point(150)]);
    touch('touchstart', [point(150), point(250, 100, 2)]);
    strictEqual(touch('touchmove', [point(80), point(300, 100, 2)]).defaultPrevented, false);
    touch('touchend', [point(80)]);

    touch('touchstart', [point(200)]);
    touch('touchmove', [point(100)]);
    touch('touchcancel', []);
    touch('touchend', [point(80)]);

    touch('touchstart', [point(200)]);
    touch('touchmove', [point(100, 100, 2)]);
    touch('touchend', [point(80, 100, 2)]);
    deepStrictEqual(directions, []);
  });

  it('不接管不可翻页区域的触摸和点击', () => {
    const {
      directions,
      point,
      touch,
      click,
    } = setup(false);
    touch('touchstart', [point(200)]);
    strictEqual(touch('touchmove', [point(100)]).defaultPrevented, false);
    touch('touchend', [point(80)]);
    strictEqual(click().defaultPrevented, false);
    deepStrictEqual(directions, []);
  });

  it('不拦截键盘点击，卸载播放器时移除所有手势监听', () => {
    const {
      element,
      controller,
      point,
      touch,
      click,
    } = setup();
    touch('touchstart', [point(200)]);
    touch('touchmove', [point(100)]);
    touch('touchend', [point(80)]);
    strictEqual(click(0).defaultPrevented, false);
    controller.abort();
    for (const type of [
      'touchstart',
      'touchmove',
      'touchend',
      'touchcancel',
      'click',
    ]) {
      strictEqual(getEventListeners(element, type).length, 0);
    }
    strictEqual(click().defaultPrevented, false);
  });
});
