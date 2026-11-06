import React from 'react';
import { type IconComponentProps, IconBox } from './icon-box';

/** 向下分享：箭头落入收纳框。 */
export function Export(props: IconComponentProps) {
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
      <path d="M5 11a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2" />
      <path d="M12 3v10m-3-3 3 3 3-3" />
    </IconBox>
  );
}
