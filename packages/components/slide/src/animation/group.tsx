import { useRenderOnce } from '@blog/context/runtime';
import React from 'react';
import { useSlideStore } from '../slide/collect/context';
import { ScopeEnd } from '../slide/collect/end';
import type { GroupKind } from '../slide/collect/scope';
import type { GroupProps, ParallelProps, SequenceProps } from './types';

function Group({ kind, children, ...props }: GroupProps & { kind: GroupKind }) {
  const store = useSlideStore();

  useRenderOnce(() => {
    store.beginGroup(kind, props);
  });

  return (
    <>
      {children}
      <ScopeEnd scope={kind} />
    </>
  );
}

/** 子项依次执行；前一项整个结束后，下一项才开始。 */
export function Sequence(props: SequenceProps) {
  return <Group {...props} kind="sequence" />;
}

/** 子项默认同时开始；所有子项结束后，分组才结束。 */
export function Parallel(props: ParallelProps) {
  return <Group {...props} kind="parallel" />;
}
