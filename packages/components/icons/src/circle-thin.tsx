import React from 'react';

import { IconBox, IconComponentProps } from './icon-box';

export function CircleThin({ className, style }: IconComponentProps) {
  return (
    <IconBox
      viewBox='0 0 8 8'
      stroke='currentColor'
      strokeWidth='1'
      className={className}
      style={style}
    >
      <path d='M 4, 4 m -3, 0 a 3,3 0 1,0 6,0 a 3,3 0 1,0 -6,0' />
    </IconBox>
  );
}
