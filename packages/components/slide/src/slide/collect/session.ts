import type { IPage } from '@blog/types';
import type { ISlideStore } from './context';

// 只把本轮 SSR 的 store 接出给收集入口，页、步骤和动作仍全部保存在 Provider 中。
const sessions = new WeakMap<IPage, { store?: ISlideStore }>();

export function beginCollection(page: IPage) {
  if (sessions.has(page)) {
    throw new Error('[mdx-slide] 同一页面不能同时进行两轮预渲染收集。');
  }

  const session: { store?: ISlideStore } = {};
  sessions.set(page, session);
  return session;
}

export function registerSlide(page: IPage, store: ISlideStore): void {
  const session = sessions.get(page);

  if (!session) {
    throw new Error('[mdx-slide] 预渲染必须通过 collectSlide 进行收集。');
  }

  if (session.store) {
    throw new Error('[mdx-slide] 每篇内容只能包含一个 Slide。');
  }

  session.store = store;
}

export function endCollection(page: IPage): void {
  sessions.delete(page);
}
