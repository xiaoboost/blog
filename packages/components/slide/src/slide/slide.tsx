import { stringifyClass } from '@xiao-ai/utils';
import React from 'react';
import { SlideComplete } from './collect/complete';
import { SlideStoreContext } from './collect/context';
import { useSlideValue } from './collect/use-slide-provider';
import styles from './index.jss';
import type { SlideProps } from './types';

export function Slide({
  children,
  className,
  style,
  ...attributes
}: SlideProps) {
  const store = useSlideValue();
  const classes = stringifyClass(styles.classes.slide, className);

  return (
    <SlideStoreContext.Provider value={store}>
      <div
        {...attributes}
        className={classes}
        style={style}
      >
        {children}
      </div>
      <SlideComplete />
    </SlideStoreContext.Provider>
  );
}
