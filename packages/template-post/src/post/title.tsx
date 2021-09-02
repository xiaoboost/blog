import React from 'react';
import styles from './index.jss';

import { toPinyin } from '@blog/utils';
import { isBaseType, isArray, isObject } from '@xiao-ai/utils';

interface HeadProps {
  props?: HeadProps;
  children: React.ReactNode;
}

function getHeadContent(props: React.ReactNode): string {
  try {
    if (isBaseType(props)) {
      return String(props);
    }
    else if (isArray(props)) {
      return props.map(getHeadContent).join('');
    }
    else if (isObject(props)) {
      return getHeadContent((props as any)?.props?.children ?? '');
    }
    else {
      return '';
    }
  }
  catch (e: any) {
    throw new Error(e);
  }
}

function createHead(level: number) {
  return function Head(props: HeadProps) {
    const Tag = `h${level}` as 'h1';
    const id = toPinyin(getHeadContent(props.children));
    return <Tag id={id}>
      <a className={styles.classes.postAnchor} href={`#${id}`}>§</a>
      {props.children}
    </Tag>;
  };
}

export const h1 = createHead(1);
export const h2 = createHead(2);
export const h3 = createHead(3);
export const h4 = createHead(4);
export const h5 = createHead(5);
