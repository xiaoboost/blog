import React from 'react';
import { stringifyClass } from '@xiao-ai/utils';

import styles from './index.jss';

export interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

interface IconBoxProps extends IconProps {
  name?: string;
  children: React.ReactNode;
}

export function IconBox({ className, style, name, children }: IconBoxProps) {
  return (
    <i data-name={name} className={stringifyClass(styles.classes.iconBox, className)} style={style}>
      {children}
    </i>
  );
}
