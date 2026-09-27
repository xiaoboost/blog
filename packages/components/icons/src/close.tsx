import React from 'react';

import { type IconComponentProps, IconBox } from './icon-box';

export function Close(props: IconComponentProps) {
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
      <path d="m7 7 10 10M17 7 7 17" />
    </IconBox>
  );
}
