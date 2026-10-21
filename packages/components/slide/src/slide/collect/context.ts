import { createContext, useContext } from 'react';
import type {
  AnimateProps,
  GroupProps,
  PlayerProps,
  StepProps,
  WaitProps,
} from '../../animation/types';
import type { SlideConfig } from '../../shared';
import type { GroupKind, ScopeKind } from './scope';

/** PPT 数据储存 */
export interface ISlideStore {
  collecting: boolean;
  beginSection(): number;
  beginPlayer(props: Omit<PlayerProps, 'children'>): void;
  beginStep(props: Omit<StepProps, 'children'>): void;
  beginGroup(kind: GroupKind, props: Omit<GroupProps, 'children'>): void;
  addAction(props: AnimateProps): void;
  addWait(props: WaitProps): void;
  end(scope: ScopeKind): void;
  getConfig(): SlideConfig;
}

/** 上下文标记 */
export const SlideStoreContext = createContext<ISlideStore | null>(null);

/** 获取 PPT 上下文 */
export function useSlideStore(): ISlideStore {
  const store = useContext(SlideStoreContext);

  if (!store) {
    throw new Error('[mdx-slide] PPT 组件必须属于 Slide。');
  }

  return store;
}
