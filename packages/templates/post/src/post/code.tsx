import { CodeBlock } from '@blog/mdx-code-block-normal';
import { type ScriptKind, type Platform, TsCodeBlock } from '@blog/mdx-code-block-typescript';
import { parseQuery } from '@blog/node';
import { isString, isUndef } from '@xiao-ai/utils';
import React from 'react';

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
  const enableLsp = isUndef(query.lsp) || query.lsp === true || query.lsp === 'true';
  const showError =
    isUndef(query.showError) || query.showError === true || query.showError === 'true';
  const visible = isUndef(query.visible) || query.visible === true || query.visible === 'true';
  const exportAs = typeof query.exportAs !== 'string' ? undefined : query.exportAs;

  if (isTs(lang) && enableLsp) {
    return (
      <TsCodeBlock
        lang={lang}
        platform={query.platform as Platform | undefined}
        showError={showError}
        visible={visible}
        exportAs={exportAs}
      >
        {data.children}
      </TsCodeBlock>
    );
  }
  else {
    return <CodeBlock lang={lang}>{data.children}</CodeBlock>;
  }
}
