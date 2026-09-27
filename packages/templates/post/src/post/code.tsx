import { useRenderContext } from '@blog/context/runtime';
import { CodeBlock } from '@blog/mdx-code-block-normal';
import { TsCodeBlock } from '@blog/mdx-code-block-typescript';
import { parseCodeBlockInfo } from '@blog/mdx-code-block-typescript/config';
import type { PageDataMap } from '@blog/types';
import { isString } from '@xiao-ai/utils';
import React from 'react';

export interface Props {
  children?: React.ReactElement<{
    className?: string;
    children?: React.ReactNode | React.ReactNode[];
  }>;
}

export function Pre(props: Props) {
  const { page } = useRenderContext();
  const { post } = page.data as PageDataMap['post'];
  const data = props.children?.props;

  if (!data || !isString(data?.children)) {
    throw new Error('代码文本格式错误');
  }

  const { lang, scriptKind, enableLsp, showError, visible, exportAs, platform } =
    parseCodeBlockInfo(data.className, post.data.lsp);

  if (scriptKind && enableLsp) {
    return (
      <TsCodeBlock
        lang={scriptKind}
        platform={platform}
        showError={showError}
        visible={visible}
        exportAs={exportAs}
      >
        {data.children}
      </TsCodeBlock>
    );
  }
  else {
    return visible ? <CodeBlock lang={lang}>{data.children}</CodeBlock> : null;
  }
}
