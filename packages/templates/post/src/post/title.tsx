import { isBaseType, isArray, isObject } from '@xiao-ai/utils';
import React from 'react';
import { createHeadAnchor, getHeadHref } from '../to-content/utils';

import styles from './index.jss';

type HeadProps = React.HTMLAttributes<HTMLHeadingElement>;

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

function createHead(level: number, getHeadAnchor: (text: string) => string) {
  return function Head(props: HeadProps) {
    const Tag = `h${level}` as 'h1';
    const { id: explicitId, children, ...attributes } = props;
    const id = explicitId ?? getHeadAnchor(getHeadContent(children));
    return (
      <Tag {...attributes} id={id}>
        <a className={styles.classes.postAnchor} href={getHeadHref(id)}>§</a>
        {children}
      </Tag>
    );
  };
}

/** 一篇文章的一次渲染共享此计数器，与其他文章和目录互不影响。 */
export function createHeadComponents() {
  const getHeadAnchor = createHeadAnchor();
  return {
    h1: createHead(1, getHeadAnchor),
    h2: createHead(2, getHeadAnchor),
    h3: createHead(3, getHeadAnchor),
    h4: createHead(4, getHeadAnchor),
    h5: createHead(5, getHeadAnchor),
    h6: createHead(6, getHeadAnchor),
  };
}
