import React from 'react';

import { type IconComponentProps, IconBox } from './icon-box';

export function ArrowUpRight(props: IconComponentProps) {
  return (
    <IconBox
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
    >
      <path d="M7 17 17 7M7 7h10v10" />
    </IconBox>
  );
}
