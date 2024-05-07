import React from 'react';

import { isString } from '@xiao-ai/utils';
import { parseQuery } from '@blog/node';
import { CodeBlock } from '@blog/mdx-code-block-normal';
import { TsCodeBlock, ScriptKind, Platform } from '@blog/mdx-code-block-typescript';

export interface Props {
  children?: React.ReactElement<{
    className: string;
    children?: React.ReactNode | React.ReactNode[];
  }>;
}

function isTs(lang: string) {
  return /tsx?/.test(lang) || /(java|type)script/.test(lang);
}

export function pre(props: Props) {
  const data = props.children?.props;

  if (!data || !isString(data?.children)) {
    throw new Error('代码文本格式错误');
  }

  const { base, query } = parseQuery(data.className);
  const lang = base.replace(/^language-/, '').toLowerCase() as ScriptKind;
  const enableLsp = !query.lsp || query.lsp === true || query.lsp === 'true';
  const showError = !query.showError || query.showError === true || query.showError === 'true';

  if (isTs(lang) && enableLsp) {
    return (
      <TsCodeBlock
        lang={lang}
        platform={query.platform as Platform | undefined}
        showError={showError}
      >
        {data.children}
      </TsCodeBlock>
    );
  } else {
    return <CodeBlock lang={lang}>{data.children}</CodeBlock>;
  }
}
