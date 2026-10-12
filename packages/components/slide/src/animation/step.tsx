import { useRenderOnce } from '@blog/context/runtime';
import React from 'react';
import { useSlideStore } from '../slide/collect/context';
import { ScopeEnd } from '../slide/collect/end';
import type { StepProps } from './types';

export function Step({ children, ...props }: StepProps) {
  const store = useSlideStore();

  useRenderOnce(() => {
    store.beginStep(props);
  });

  return (
    <>
      {children}
      <ScopeEnd scope="step" />
    </>
  );
}
