import React from 'react';

import { IconBox, IconProps } from './icon-box';

export function Cross({ className, style }: IconProps) {
  return (
    <IconBox name='cross' className={className} style={style}>
      <svg
        viewBox='0 0 48 48'
        version='1.1'
        width='1em'
        height='1em'
        aria-hidden='true'
        fill='transparent'
        stroke='currentColor'
        strokeWidth='1'
      >
        <path d='M 2, 2 L 6, 6 M 6, 2 L 2, 6' />
      </svg>
    </IconBox>
  );
}
