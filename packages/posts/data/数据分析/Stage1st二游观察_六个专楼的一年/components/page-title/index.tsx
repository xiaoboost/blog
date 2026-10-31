import { useRenderContext } from '@blog/context/runtime';
import { PrimaryTitleFont } from '@blog/styles';
import React, { type ComponentPropsWithoutRef, type ReactNode } from 'react';

type PageTitleProps = ComponentPropsWithoutRef<'h2'> & { as?: 'h1' | 'h2' };

function titleText(children: ReactNode): string {
  return React.Children.toArray(children).map(child => {
    if (typeof child === 'string' || typeof child === 'number') return String(child);
    return React.isValidElement<{ children?: ReactNode }>(child) ? titleText(child.props.children) : '';
  }).join('');
}

/** 每页大标题复用模板字体，并将文字加入该文章的字体子集。 */
export function PageTitle({ as: Heading = 'h2', children, className, ...props }: PageTitleProps) {
  const { page, isPreBuild } = useRenderContext();
  const bucket = page.getFontBucket(PrimaryTitleFont.fontFamily);
  if (isPreBuild) bucket.addText(titleText(children));
  return <Heading {...props} className={[bucket.getClassName(), className].filter(Boolean).join(' ')}>{children}</Heading>;
}
