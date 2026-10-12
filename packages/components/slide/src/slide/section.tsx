import { useRenderOnce } from '@blog/context/runtime';
import { stringifyClass } from '@xiao-ai/utils';
import React, { useRef } from 'react';
import { useSlideStore } from './collect/context';
import { ScopeEnd } from './collect/end';
import styles from './index.jss';
import type { SectionProps } from './types';

export function Section({
  children,
  id,
  title,
  className,
  style,
  ...attributes
}: SectionProps) {
  const store = useSlideStore();
  const index = useRef(-1);

  useRenderOnce(() => {
    index.current = store.beginSection();
  });

  return (
    <section
      {...attributes}
      id={id}
      className={stringifyClass(styles.classes.section, className)}
      style={style}
      data-slide-section={index.current}
      data-slide-title={title}
    >
      {children}
      <ScopeEnd scope="section" />
    </section>
  );
}
