import { useRenderContext } from '@blog/context/runtime';
import { normalizeUrl } from '@blog/node';
import { SiteTitleFontFamily } from '@blog/styles';
import { stringifyClass } from '@xiao-ai/utils';
import type { CSSProperties } from 'react';
import styles from './index.jss';

export interface SignProps {
  className?: string;
  style?: CSSProperties;
}

/** 使用站点标题手写体的站点署名，点击返回首页。 */
export function Sign({ className, style }: SignProps) {
  const { site, isPreBuild } = useRenderContext();

  if (isPreBuild) {
    site.getFontBucket(SiteTitleFontFamily).addText(site.title);
  }

  return (
    <div className={stringifyClass(styles.classes.sign, className)} style={style}>
      <a href={normalizeUrl(site.publicPath)} aria-label={`${site.title} 首页`}>{site.title}</a>
    </div>
  );
}
