import { strictEqual } from 'node:assert/strict';
import { describe, it } from '@blog/test-toolkit';
import { hitsText } from '../player/text-hit';

describe('PPT 文字命中区域', () => {
  it('命中文字行框才保留选字，行间和段落空白可开始拖动', () => {
    const originalElement = Object.getOwnPropertyDescriptor(globalThis, 'Element');
    const originalFilter = Object.getOwnPropertyDescriptor(globalThis, 'NodeFilter');
    const nodes = [
      {
        textContent: '   ', rects: [
          {
            left: 0,
            right: 100,
            top: 0,
            bottom: 10,
          },
        ],
      },
      {
        textContent: '第一行\n第二行', rects: [
          {
            left: 20,
            right: 100,
            top: 20,
            bottom: 40,
          },
          {
            left: 20,
            right: 60,
            top: 50,
            bottom: 70,
          },
        ],
      },
    ];
    class TestElement {
      ownerDocument = {
        createTreeWalker: () => {
          let index = -1;
          return {
            nextNode: () => nodes[++index],
            get currentNode() {
              return nodes[index];
            },
          };
        },
        createRange: () => {
          let selected = nodes[0];
          return {
            selectNodeContents: (node: typeof selected) => {
              selected = node;
            },
            getClientRects: () => selected.rects,
          };
        },
      };
    }
    Object.defineProperty(globalThis, 'Element', { configurable: true, value: TestElement });
    Object.defineProperty(globalThis, 'NodeFilter', { configurable: true, value: { SHOW_TEXT: 4 } });
    try {
      const target = new TestElement();
      const hit = (clientX: number, clientY: number) => hitsText(
        { target, clientX, clientY } as unknown as PointerEvent,
      );
      strictEqual(hit(30, 30), true);
      strictEqual(hit(30, 60), true);
      strictEqual(hit(30, 45), false);
      strictEqual(hit(80, 60), false);
      strictEqual(hit(10, 30), false);
      strictEqual(hit(30, 5), false);
    }
    finally {
      for (const [name, descriptor] of [['Element', originalElement], ['NodeFilter', originalFilter]] as const) {
        if (descriptor) {
          Object.defineProperty(globalThis, name, descriptor);
        }
        else {
          Reflect.deleteProperty(globalThis, name);
        }
      }
    }
  });
});
