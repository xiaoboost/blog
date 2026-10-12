import { stringifyClass } from '@xiao-ai/utils';
import React, { type CSSProperties } from 'react';
import type { VisualProps } from '../types';
import styles from './index.jss';

export interface BackgroundProps extends Omit<VisualProps, 'children'> {
  src?: string;
  background?: CSSProperties['background'];
  fit?: CSSProperties['objectFit'];
  position?: CSSProperties['objectPosition'];
  overlay?: string;
  zIndex?: number;
}

export function Background({
  src,
  background,
  fit = 'cover',
  position,
  overlay,
  zIndex,
  className,
  style,
  ...attributes
}: BackgroundProps) {
  return (
    <div
      {...attributes}
      aria-hidden="true"
      className={stringifyClass(styles.classes.background, className)}
      style={{
        background,
        zIndex,
        ...style,
      }}
    >
      {src !== undefined && (
        <img
          src={src}
          alt=""
          className={styles.classes.backgroundImage}
          style={{
            objectFit: fit,
            objectPosition: position,
          }}
        />
      )}
      {overlay !== undefined
        && <div className={styles.classes.backgroundOverlay} style={{ background: overlay }} />}
    </div>
  );
}
