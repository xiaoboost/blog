import React from 'react';
import styles from './index.jss';

import { isArray, isString } from '@xiao-ai/utils';

export interface Props {
  children: React.ReactNode | React.ReactNode[];
}

export function p(props: Props) {
  const children: React.ReactNode[] = [];
  const nodes = isArray(props.children) ? props.children : [props.children];

  // debugger;
  for (const node of nodes) {
    if (isString(node)) {
      const stringNodes = node.split(/[\r\n]+/);
      for (let i = 0; i < stringNodes.length; i++) {
        children.push(stringNodes[i]);

        if (i < stringNodes.length - 1) {
          children.push(<br key={`br-${i}`} />);
          children.push(<span key={`span-${i}`} className={styles.classes.postSoftBreak} />);
        }
      }
    } else {
      children.push(node);
    }
  }

  return <p>{children}</p>;
}
