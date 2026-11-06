import { resolve } from 'path';
import { createContext, runInContext } from 'vm';
import { describe, expect, it } from '@blog/test-toolkit';
import { buildSync } from 'esbuild';
import { HMRKind, HMRUpdateKind } from '../plugins/development/types';
import { getHtmlDiff } from '../plugins/development/utils';

const bundle = (file: string, globalName: string) => buildSync({
  entryPoints: [resolve(__dirname, file)],
  bundle: true,
  write: false,
  platform: 'browser',
  format: 'iife',
  globalName,
}).outputFiles[0].text;

describe('按需资源热更新', () => {
  const html = (head = '', body = '正文') => `<html><head>${head}</head><body>${body}</body></html>`;
  const path = '/posts/test/index.html';

  it('新增、移除或替换资源时整页刷新，包括只改变 head 的样式', () => {
    for (const updated of [
      html('<link rel="stylesheet" href="/styles/code.css">'),
      html('', '正文<script src="/scripts/code.js"></script>'),
    ]) {
      expect(getHtmlDiff(html(), updated, path)).deep.eq([{ kind: HMRUpdateKind.Reload, path }]);
      expect(getHtmlDiff(updated, html(), path)).deep.eq([{ kind: HMRUpdateKind.Reload, path }]);
    }
    expect(getHtmlDiff(html('', '<script src="a.js"></script>'), html('', '<script src="b.js"></script>'), path)[0].kind)
      .eq(HMRUpdateKind.Reload);
  });

  it('只有正文变化时继续局部更新', () => {
    expect(getHtmlDiff(html(), html('', '新正文'), path)[0].kind).eq(HMRUpdateKind.HTML);
    expect(getHtmlDiff(html(), html(), path)).deep.eq([]);
    expect(getHtmlDiff(html('<title>原题</title>'), html('<title>新题</title>'), path)).deep.eq([]);
  });

  it('脚本引用、配置、位置或顺序变化时整页刷新', () => {
    const first = '<script src="/scripts/theme.js"></script>';
    const second = '<script src="/scripts/ready.js" defer=""></script>';
    const reload = [{ kind: HMRUpdateKind.Reload, path }];
    expect(getHtmlDiff(html(), html(first), path)).deep.eq(reload);
    expect(getHtmlDiff(html(first), html(), path)).deep.eq(reload);
    expect(getHtmlDiff(html(first), html(first.replace('theme.js', 'theme.v2.js')), path)).deep.eq(reload);
    for (const attr of [
      'defer=""',
      'async=""',
      'type="module"',
      'crossorigin="anonymous"',
    ]) {
      expect(getHtmlDiff(html(first), html(first.replace('<script ', `<script ${attr} `)), path))
        .deep.eq(reload);
      expect(getHtmlDiff(html('', first), html('', first.replace('<script ', `<script ${attr} `)), path))
        .deep.eq(reload);
    }
    expect(getHtmlDiff(html(first + second), html(second + first), path)).deep.eq(reload);
    expect(getHtmlDiff(html(first), html('', `正文${first}`), path)).deep.eq(reload);
    expect(getHtmlDiff(html(first), html(first), path)).deep.eq([]);
    expect(getHtmlDiff(html(first), html(first, '新正文'), path)[0].kind).eq(HMRUpdateKind.HTML);
  });

  it('样式路径不变、媒体条件或跨域配置变化时整页刷新', () => {
    const style = '<link rel="stylesheet" href="/styles/test.css">';
    for (const attr of ['media="print"', 'media="screen and (min-width: 768px)"', 'crossorigin="anonymous"']) {
      expect(getHtmlDiff(html(style), html(style.replace('<link ', `<link ${attr} `)), path))
        .deep.eq([{ kind: HMRUpdateKind.Reload, path }]);
    }
  });

  it('head 或带加载配置的 body 脚本更新时通过刷新保留其执行语义', () => {
    const runtime = bundle('../plugins/development/runtime/utils.ts', 'hmr');
    for (const config of [
      { head: true },
      { type: 'module' },
      { defer: true },
      { async: true },
      { crossOrigin: 'anonymous' },
      { crossOrigin: 'use-credentials' },
    ]) {
      let reloads = 0;
      const context = createContext({
        window: {},
        location: { reload: () => reloads++ },
        document: {
          querySelectorAll: () => [{ ...config, getAttribute: () => '/scripts/init.js?123' }],
          head: { contains: () => Boolean(config.head) },
        },
      });
      runInContext(runtime, context);
      context.hmr.reloadJS('/scripts/init.js', 'throw new Error("应通过刷新加载");');
      expect(reloads, JSON.stringify(config)).eq(1);
    }
  });

  it('页面更新精确匹配路径，首页不会响应所有文章的更新', () => {
    const context = createContext({ window: {}, location: { pathname: '/' } });
    runInContext(bundle('../plugins/development/runtime/utils.ts', 'hmr'), context);
    expect(context.hmr.isHTMLFile('/index.html')).true;
    expect(context.hmr.isHTMLFile(path)).false;
    for (const pathname of ['/posts/test', '/posts/test/', path]) {
      context.location.pathname = pathname;
      expect(context.hmr.isHTMLFile(path)).true;
      expect(context.hmr.isHTMLFile('/posts/test/other/index.html')).false;
    }
  });

  it('同文件内的模块连续更新仍按原文件路径卸载，不影响其他文件', () => {
    const runtime = bundle('../plugins/development/runtime/utils.ts', 'hmr');
    const helper = bundle('../../../../utils/web/src/element.ts', 'web');
    const context = createContext({
      window: {},
      active: 0,
      removed: 0,
      ids: [] as string[],
    });
    const scripts: unknown[] = [];
    const externalScripts: { getAttribute: (name: string) => string | null }[] = [];
    const document = {
      currentScript: null as any,
      querySelectorAll: () => externalScripts,
      createElement: () => {
        const attributes = new Map<string, string>();
        const script = {
          textContent: '',
          getAttribute: (name: string) => attributes.get(name) ?? null,
          setAttribute: (name: string, value: string) => attributes.set(name, value),
          remove: () => scripts.splice(scripts.indexOf(script), 1),
        };
        return script;
      },
      head: {
        contains: () => false,
        appendChild(script: { textContent: string }) {
          scripts.push(script);
          document.currentScript = script;
          try {
            runInContext(script.textContent, context);
          }
          finally {
            document.currentScript = null;
          }
        },
      },
    };
    context.document = document;
    runInContext(runtime + helper, context);
    const code = `(() => {
      const currentScript = web.getCurrentScriptSrc();
      ids.push(currentScript);
      window.__ModuleLoader.install({ currentScript, active() {
        active++;
        return () => { active--; removed++; };
      }});
    })();`;
    const initial = document.createElement();
    initial.setAttribute('src', '/scripts/post.js');
    externalScripts.push(initial);
    document.currentScript = initial;
    runInContext(code + code, context);
    document.currentScript = null;
    context.hmr.reloadJS('/scripts/other.js', code);
    for (let i = 0; i < 3; i++) {
      context.hmr.reloadJS('/scripts/post.js', code + code);
      expect(context.active).eq(3);
      expect(context.removed).eq((i + 1) * 2);
      expect(scripts).length(0);
    }
    expect(context.ids).deep.eq([
      '/scripts/post.js',
      '/scripts/post.js',
      '/scripts/other.js',
      ...Array(6).fill('/scripts/post.js'),
    ]);
  });

  it('HTML 与 JS 同批更新时先卸载旧实例，全部更新后只启动一次，不受消息顺序影响', () => {
    const runtime = bundle('../plugins/development/runtime/client.ts', 'client');
    for (const htmlFirst of [false, true]) {
      let receive: (event: { data: string }) => void;
      class Socket {
        addEventListener(_name: string, listener: typeof receive) {
          receive = listener;
        }
      }
      const state = { active: 0, starts: 0, stops: 0 };
      let content = 'old';
      const body = {
        get innerHTML() {
          return content;
        },
        set innerHTML(value: string) {
          expect(state.active).eq(0);
          content = value;
        },
      };
      const location = { protocol: 'http:', host: 'localhost', pathname: '/posts/test/' };
      const context = createContext({
        window: { WebSocket: Socket, location },
        WebSocket: Socket,
        location,
        state,
        console: { log() {} },
      });
      context.document = {
        body,
        getElementById: () => null,
        querySelector: () => body,
        querySelectorAll: () => [{ getAttribute: () => '/scripts/slide.js' }],
        createElement: () => ({ textContent: '', setAttribute() {}, remove() {} }),
        head: {
          contains: () => false,
          appendChild: (script: { textContent: string }) => (
            runInContext(script.textContent, context)
          ),
        },
      };
      runInContext(runtime, context);
      const code = (version: string) => `window.__ModuleLoader.install({
        currentScript: '/scripts/slide.js',
        active() {
          if (document.body.innerHTML !== '${version}') {
            throw new Error('新脚本读取了旧 DOM');
          }
          state.active++; state.starts++;
          return () => { state.active--; state.stops++; };
        }
      });`;
      runInContext(code('old'), context);
      for (let i = 1; i <= 3; i++) {
        const updates = [
          { kind: HMRUpdateKind.JS, path: '/scripts/slide.js', code: code(`v${i}`) },
          {
            kind: HMRUpdateKind.HTML,
            path,
            selector: 'body',
            content: `v${i}`,
          },
        ];
        receive!({
          data: JSON.stringify({
            kind: HMRKind.Update,
            updates: htmlFirst ? updates.reverse() : updates,
          }),
        });
        expect(state).deep.eq({ active: 1, starts: i + 1, stops: i });
      }
      receive!({
        data: JSON.stringify({
          kind: HMRKind.Update, updates: [
            {
              kind: HMRUpdateKind.HTML,
              path,
              selector: 'body',
              content: 'v3',
            },
          ],
        }),
      });
      expect(state).deep.eq({ active: 1, starts: 5, stops: 4 });
      receive!({
        data: JSON.stringify({
          kind: HMRKind.Update, updates: [
            {
              kind: HMRUpdateKind.HTML,
              path: '/other/index.html',
              selector: 'body',
              content: 'other',
            },
          ],
        }),
      });
      expect(state).deep.eq({ active: 1, starts: 5, stops: 4 });
      receive!({
        data: JSON.stringify({
          kind: HMRKind.Update, updates: [{ kind: HMRUpdateKind.JS, path: '/scripts/slide.js', code: code('v3') }],
        }),
      });
      expect(state).deep.eq({ active: 1, starts: 6, stops: 5 });
    }
  });
});
