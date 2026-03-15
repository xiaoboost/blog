import React from 'react';

import { IconBox, IconProps } from './icon-box';

export function Circle({ className, style }: IconProps) {
  return (
    <IconBox name='circle' className={className} style={style}>
      <svg
        viewBox='0 0 8 8'
        version='1.1'
        width='1em'
        height='1em'
        aria-hidden='true'
        fill='currentColor'
      >
        <path d='M 4, 4 m -3, 0 a 3,3 0 1,0 6,0 a 3,3 0 1,0 -6,0' />
      </svg>
    </IconBox>
  );
}
