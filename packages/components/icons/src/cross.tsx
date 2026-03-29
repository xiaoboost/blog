import React from 'react';

import { IconBox, IconComponentProps } from './icon-box';

export function Cross({ className, style }: IconComponentProps) {
  return (
    <IconBox
      viewBox='0 0 48 48'
      stroke='currentColor'
      strokeWidth='1'
      className={className}
      style={style}
    >
      <path d='M 2, 2 L 6, 6 M 6, 2 L 2, 6' />
    </IconBox>
  );
}
