import { useRenderOnce } from '@blog/context/runtime';
import React from 'react';
import { useSlideStore } from '../slide/collect/context';
import { ScopeEnd } from '../slide/collect/end';
import type { PlayerProps } from './types';

export function Player(props: PlayerProps) {
  const context = useSlideStore();

  useRenderOnce(() => {
    context.beginPlayer(props);
  });

  return (
    <>
      {props.children}
      <ScopeEnd scope="player" />
    </>
  );
}
