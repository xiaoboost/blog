import { stringifyClass } from '@xiao-ai/utils';
import React from 'react';
import { SlideStoreContext, useSlideStore } from './collect/context';
import styles from './index.jss';
import type { SlideProps } from './types';

export function Slide({
  children,
  className,
  style,
  ...attributes
}: SlideProps) {
  const store = useSlideStore();
  const classes = stringifyClass('reveal', styles.classes.slide, className);

  return (
    <SlideStoreContext.Provider value={store}>
      <div
        {...attributes}
        className={classes}
        style={style}
      >
        {children}
      </div>
    </SlideStoreContext.Provider>
  );
}
