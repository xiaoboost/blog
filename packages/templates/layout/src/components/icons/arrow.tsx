import React from 'react';

import { IconCreator, IconProps } from './icons';

function ArrowBase(props: IconProps) {
  return (
    <IconCreator {...props} name='arrow'>
      <svg
        width='1em'
        height='1em'
        version='1.1'
        viewBox='0 0 1024 1024'
        fill='currentColor'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path
          fill='currentColor'
          d='M338.752 104.704a64 64 0 0 0 0 90.496l316.8 316.8-316.8 316.8a64 64 0 0 0 90.496 90.496l362.048-362.048a64 64 0 0 0 0-90.496L429.248 104.704a64 64 0 0 0-90.496 0z'
        />
      </svg>
    </IconCreator>
  );
}

export function ArrowRight(props: IconProps) {
  return (
    <ArrowBase
      {...props}
      style={{
        ...props.style,
        transform: 'translateY(2px)',
      }}
    />
  );
}

export function ArrowLeft(props: IconProps) {
  return (
    <ArrowBase
      {...props}
      style={{
        ...props.style,
        transform: 'rotate(180deg) translateY(-2px)',
      }}
    />
  );
}
