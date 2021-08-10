import React from 'react';

import { stringifyClass } from '@xiao-ai/utils';

type SpanProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;

export type IconProps = SpanProps

interface IconCreatorProps extends IconProps {
  name: string;
}

export function IconCreator(props: IconCreatorProps) {
  return <span
    {...props}
    aria-label={props.name}
    className={stringifyClass('blog-icon', props.className)}>
    {props.children}
  </span>;
}
