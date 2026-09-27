import React from 'react';

import { type IconComponentProps, IconBox } from './icon-box';

export function Check(props: IconComponentProps) {
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
      <path d="m5 12 4 4L19 6" />
    </IconBox>
  );
}
