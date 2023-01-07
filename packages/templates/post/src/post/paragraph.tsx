import React from 'react';
import { isArray, isString } from '@xiao-ai/utils';

import styles from './index.jss';

export interface Props {
  children?: React.ReactNode | React.ReactNode[];
}

/**
 * 是否包含首行退格
 *   - 现阶段只有整行图片不包含退格
 */
function hasStartIndent(nodes: React.ReactNode[]) {
  if (nodes.length !== 1 || !React.isValidElement(nodes[0])) {
    return true;
  }

  const node = nodes[0];

  if (node.type === 'img') {
    return false;
  }

  return true;
}

export function p(props: Props) {
  const children: React.ReactNode[] = [];
  const nodes = isArray(props.children) ? props.children : [props.children];

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

  if (hasStartIndent(nodes)) {
    return <p>{children}</p>;
  } else {
    return <p className={styles.classes.noIndent}>{children}</p>;
  }
}
