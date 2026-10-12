import { useRenderOnce } from '@blog/context/runtime';
import React from 'react';
import { useSlideStore } from '../slide/collect/context';
import { ScopeEnd } from '../slide/collect/end';
import type { PlayerProps } from './types';

export function Player({ children, ...props }: PlayerProps) {
  const store = useSlideStore();

  useRenderOnce(() => {
    store.beginPlayer(props);

    if (!store.collecting) {
      store.end('player');
    }
  });

  if (!store.collecting) {
    return null;
  }

  return (
    <>
      {children}
      <ScopeEnd scope="player" />
    </>
  );
}
