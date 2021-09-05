import React from 'react';

import { isString } from '@xiao-ai/utils';
import { CodeBlock } from '@blog/mdx-code-block-normal';
import { TsCodeBlock, ScriptKind, Platform } from '@blog/mdx-code-block-typescript';

export interface Props {
  children: React.ReactElement<{
    className: string;
    platform: Platform;
    children: React.ReactNode | React.ReactNode[];
  }>;
}

function isTs(lang: string) {
  return /tsx?/.test(lang) || /(java|type)script/.test(lang);
}

export function pre(props: Props) {
  const data = props.children.props;

  if (!isString(data.children)) {
    throw new Error('代码文本格式错误');
  }

  const lang = data.className.replace(/^language-/, '').toLowerCase();

  if (isTs(lang)) {
    return <TsCodeBlock
      lang={lang as ScriptKind}
      platform={data.platform}>
      {data.children}
    </TsCodeBlock>;
  }
  else {
    return <CodeBlock lang={lang}>{data.children}</CodeBlock>;
  }
}
