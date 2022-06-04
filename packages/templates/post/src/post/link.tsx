import React from 'react';

export interface Props {
  href: string;
  children?: string;
}

export function a(props: Props) {
  return (
    <a target='_blank' rel='noreferrer' href={props.href}>
      {props.children}
    </a>
  );
}
