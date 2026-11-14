import { useRenderContext, useRenderOnce } from '@blog/context/runtime';
import { useSlideStore } from '../slide/collect/context';
import { ScopeEnd } from '../slide/collect/end';
import type { PlayerProps } from './types';

export function Player({ children, ...props }: PlayerProps) {
  const store = useSlideStore();
  const { isPreBuild } = useRenderContext();

  useRenderOnce(() => {
    if (isPreBuild) {
      store.beginPlayer(props);
    }
  });

  if (!isPreBuild) {
    return null;
  }

  return (
    <>
      {children}
      <ScopeEnd scope="player" />
    </>
  );
}
