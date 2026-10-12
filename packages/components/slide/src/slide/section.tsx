import { useRenderOnce } from '@blog/context/runtime';
import React from 'react';
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
  const context = useSlideStore();

  const index = useRenderOnce(() => context.beginSection());

  return (
    <section
      {...attributes}
      id={id}
      className={[styles.classes.section, className].filter(Boolean).join(' ')}
      style={style}
      data-slide-section={index}
      data-slide-title={title}
    >
      {children}
      <ScopeEnd scope="section" />
    </section>
  );
}
