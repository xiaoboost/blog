import React from 'react';

import { stringifyClass } from '@xiao-ai/utils';
import styles from './index.jss';

type SpanProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;

export type IconProps = SpanProps;

interface IconCreatorProps extends IconProps {
  name: string;
}

export function IconCreator(props: IconCreatorProps) {
  return (
    <span
      {...props}
      aria-label={props.name}
      className={stringifyClass(styles.classes.blogIcon, props.className)}
    >
      {props.children}
    </span>
  );
}
