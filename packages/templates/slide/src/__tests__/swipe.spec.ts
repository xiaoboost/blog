import { deepStrictEqual, strictEqual } from 'node:assert/strict';
import { getEventListeners } from 'node:events';
import { describe, it } from '@blog/test-toolkit';
import { bindSwipe } from '../player/swipe';

function setup(pointerType: string, allowed = true) {
  const element = new EventTarget();
  const document = new EventTarget();
  const window = new EventTarget();
  Object.assign(element, { ownerDocument: document });
  Object.assign(document, { defaultView: window });
  const controller = new AbortController();
  const directions: number[] = [];
  bindSwipe(element as HTMLElement, {
    signal: controller.signal,
    canStart: () => allowed,
    onSwipe: (direction) => directions.push(direction),
  });
  const pointer = (type: string, x: number, y = 100, extra = {}) => {
    const event = new Event(type, { cancelable: true });
    Object.assign(event, {
      pointerType,
      pointerId: 1,
      isPrimary: true,
      button: 0,
      buttons: type === 'pointerup' ? 0 : 1,
      clientX: x,
      clientY: y,
    }, extra);
    document.dispatchEvent(event);

    if (type === 'pointerdown') {
      element.dispatchEvent(event);
    }

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
    document,
    window,
    controller,
    directions,
    pointer,
    click,
  };
}

for (const pointerType of ['mouse', 'touch']) {
  describe(`PPT ${pointerType} 翻页`, () => {
    it('左右拖动各翻一次，松手点击被拦截，下一次轻点正常', () => {
      const { pointer, click, directions } = setup(pointerType);
      pointer('pointerdown', 200);
      strictEqual(pointer('pointermove', 100).defaultPrevented, true);
      pointer('pointerup', 80);
      strictEqual(click().defaultPrevented, true);
      strictEqual(click(0).defaultPrevented, false);
      pointer('pointerdown', 80);
      pointer('pointermove', 150);
      pointer('pointerup', 200);
      deepStrictEqual(directions, [1, -1]);
      pointer('pointerdown', 100);
      pointer('pointerup', 102);
      strictEqual(click().defaultPrevented, false);
    });

    it('短拖和滑回起点不翻页，也不误触点击', () => {
      const { pointer, click, directions } = setup(pointerType);
      for (const end of [180, 195]) {
        pointer('pointerdown', 200);
        pointer('pointermove', end === 180 ? 180 : 100);
        pointer('pointerup', end);
        strictEqual(click().defaultPrevented, true);
      }
      deepStrictEqual(directions, []);
    });

    it('纵向或斜向开始后不能转为翻页', () => {
      const { pointer, click, directions } = setup(pointerType);
      for (const x of [200, 170]) {
        pointer('pointerdown', 200);
        strictEqual(pointer('pointermove', x, 140).defaultPrevented, false);
        pointer('pointermove', 50, 145);
        pointer('pointerup', 50, 145);
        strictEqual(click().defaultPrevented, true);
      }
      deepStrictEqual(directions, []);
    });

    it('系统取消、第二触点、窗口失焦均不翻页', () => {
      const { pointer, window, directions } = setup(pointerType);
      for (const reason of ['cancel', 'second', 'blur']) {
        pointer('pointerdown', 200);
        pointer('pointermove', 100);

        if (reason === 'cancel') {
          pointer('pointercancel', 100);
        }
        else if (reason === 'second') {
          pointer('pointerdown', 250, 100, { pointerId: 2, isPrimary: false });
        }
        else {
          window.dispatchEvent(new Event('blur'));
        }

        pointer('pointerup', 80);
      }
      deepStrictEqual(directions, []);
    });

    it('忽略其他指针，不接管禁止区域、右键和非主指针', () => {
      const { pointer, directions } = setup(pointerType);
      pointer('pointerdown', 200);
      pointer('pointermove', 80, 100, { pointerId: 2 });
      pointer('pointerup', 80, 100, { pointerId: 2 });
      deepStrictEqual(directions, []);
      pointer('pointercancel', 200);
      for (const extra of [{ button: 2 }, { isPrimary: false }]) {
        pointer('pointerdown', 200, 100, extra);
        pointer('pointermove', 100);
        pointer('pointerup', 80);
      }
      deepStrictEqual(directions, []);
      const blocked = setup(pointerType, false);
      blocked.pointer('pointerdown', 200);
      strictEqual(blocked.pointer('pointermove', 100).defaultPrevented, false);
      blocked.pointer('pointerup', 80);
      strictEqual(blocked.click().defaultPrevented, false);
      deepStrictEqual(blocked.directions, []);
    });

    it('空白拖动阻止原生选字和图片拖拽，卸载后清理所有监听', () => {
      const {
        pointer,
        element,
        document,
        window,
        controller,
      } = setup(pointerType);
      pointer('pointerdown', 200);
      for (const type of ['selectstart', 'dragstart']) {
        const event = new Event(type, { cancelable: true });
        element.dispatchEvent(event);
        strictEqual(event.defaultPrevented, true);
      }
      controller.abort();
      for (const target of [element, document, window]) {
        for (const type of [
          'pointerdown',
          'pointermove',
          'pointerup',
          'pointercancel',
          'click',
          'selectstart',
          'dragstart',
          'blur',
        ]) {
          strictEqual(getEventListeners(target, type).length, 0);
        }
      }
    });
  });
}
