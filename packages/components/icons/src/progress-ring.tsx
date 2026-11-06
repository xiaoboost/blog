import React from 'react';
import { type IconComponentProps, IconBox } from './icon-box';

export function ProgressRing(props: IconComponentProps) {
  return (
    <IconBox
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      focusable="false"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        opacity="0.2"
      />
      <circle
        cx="12"
        cy="12"
        r="9"
        pathLength="100"
        strokeDasharray="100"
        strokeDashoffset="75"
        transform="rotate(-90 12 12)"
      />
    </IconBox>
  );
}
