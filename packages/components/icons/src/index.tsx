import React from 'react';
import { stringifyClass } from '@xiao-ai/utils';

import styles from './index.jss';
import * as icons from './data';

interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

function createIcon(name: string, { path, viewBox, ...props }: icons.Icon) {
  return function Icon({ className, style }: IconProps) {
    return (
      <i
        data-name={name}
        className={stringifyClass(styles.classes.iconBox, className)}
        style={style}
      >
        <svg viewBox={viewBox} version='1.1' width='1em' height='1em' aria-hidden='true' {...props}>
          <path d={path} />
        </svg>
      </i>
    );
  };
}

export const Circle = createIcon('circle', icons.circle);
export const CircleThin = createIcon('circle-thin', icons.circleThin);
