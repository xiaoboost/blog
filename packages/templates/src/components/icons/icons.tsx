import React from 'react';

import { stringifyClass } from 'src/utils/template';

type SpanProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;

export interface IconProps extends SpanProps {
  // ..
}

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
