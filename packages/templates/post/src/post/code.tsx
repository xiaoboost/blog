import { CodeBlock } from '@blog/mdx-code-block-normal';
import { parseQuery } from '@blog/node';
import { isString } from '@xiao-ai/utils';
import React from 'react';

export interface Props {
  children?: React.ReactElement<{
    className?: string;
    children?: React.ReactNode | React.ReactNode[];
  }>;
}

export function Pre(props: Props) {
  const data = props.children?.props;

  if (!data || !isString(data?.children)) {
    throw new Error('代码文本格式错误');
  }

  const { base: lang } = parseQuery(data.className?.replace(/^language-/, '') ?? '');
  return <CodeBlock lang={lang}>{data.children}</CodeBlock>;
}
