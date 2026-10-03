import { resolve } from 'path';
import { runInNewContext } from 'vm';
import { describe, expect, it } from '@blog/test-toolkit';
import { buildSync } from 'esbuild';

const source = buildSync({
  entryPoints: [resolve(__dirname, '../plugins/development/runtime/utils.ts')],
  bundle: true, write: false, platform: 'browser', format: 'iife', globalName: 'hmr',
}).outputFiles[0].text;

function setup() {
  const timers = new Map<number, () => void>();
  let tick = 0;

  class Link {
    href: string;
    onLoad = () => {};
    parentNode = {
      insertBefore: (link: Link) => links.push(link),
      removeChild: (link: Link) => links.splice(links.indexOf(link), 1),
    };

    constructor(href: string) {
      this.href = href;
    }

    getAttribute() {
      return this.href;
    }

    setAttribute(_name: string, value: string) {
      this.href = value;
    }

    cloneNode() {
      return new Link(this.href);
    }

    addEventListener(_event: string, listener: () => void) {
      this.onLoad = listener;
    }
  }

  const links = [new Link('/styles/post.css'), new Link('/styles/post.css.map')];
  const context = {
    window: {},
    document: {
      querySelector: (selector: string) => links.find((link) => selector === `link[href|="${link.href}"]`),
      querySelectorAll: () => links.slice(),
    },
    Date: { now: () => ++tick },
    setTimeout: (callback: () => void) => {
      timers.set(++tick, callback);
      return tick;
    },
    clearTimeout: (id: number) => timers.delete(id),
    hmr: {} as { reloadCSS(src: string): void },
  };
  runInNewContext(source, context);

  return {
    links,
    reload(src = '/styles/post.css') {
      context.hmr.reloadCSS(src);
      const callbacks = [...timers.values()];
      timers.clear();
      callbacks.forEach((callback) => callback());
    },
  };
}

describe('CSS 热更新', () => {
  it('带时间戳的样式链接可以连续更新，加载完成后才替换旧样式', () => {
    const { links, reload } = setup();
    const unrelated = links[1];
    let current = links[0];

    for (let i = 0; i < 3; i++) {
      reload();
      expect(links).to.have.length(3);
      expect(links).to.include(current);
      const next = links[2];
      expect(next.href).to.match(/^\/styles\/post\.css\?\d+$/);
      expect(next.href).not.to.eq(current.href);

      next.onLoad();
      expect(links).not.to.include(current);
      expect(links).to.have.length(2);
      expect(links).to.include(unrelated);
      current = next;
    }
  });

  it('没有对应样式时保留现有链接', () => {
    const { links, reload } = setup();
    const before = links.slice();
    reload('/styles/missing.css');
    expect(links).to.deep.eq(before);
  });
});
