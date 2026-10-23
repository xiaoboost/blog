import { useRenderContext } from '@blog/context/runtime';
import { normalizeUrl } from '@blog/node';
import { HMRClientScriptPath } from '@blog/shared';
import type { ScriptAssetData, TemplateAsset } from '@blog/types';
import { default as React, type PropsWithChildren } from 'react';

import favicon from '../../assets/images/favicon.ico';
import { OgMeta } from './og-meta';
import { getDocumentResources } from './resources';
import { SeoMeta } from './seo-meta';

export interface DocumentProps {
  /** body 的页面级样式 */
  className?: string;
  /** 错误页不参与索引，也不声明 canonical 和分享地址 */
  noIndex?: boolean;
  /** 网页作者 */
  author?: string;
  /** 网页描述 */
  description?: string;
  /** 网页内容关键字 */
  keywords?: string[];
  /** 文章发布时间 */
  publishedTime?: number;
  /** 文章最后修改时间 */
  modifiedTime?: number;
  /** 当前模板或文章额外需要的资源，公共资源由文档统一接入。 */
  assets?: readonly TemplateAsset[];
}

function Script({ script, publicPath }: { script: ScriptAssetData; publicPath: string }) {
  return (
    <script
      type={script.type ?? 'text/javascript'}
      src={normalizeUrl(publicPath, script.src)}
      defer={script.defer}
      async={script.async}
      crossOrigin={script.crossOrigin}
    />
  );
}

export function Document(props: PropsWithChildren<DocumentProps>) {
  const { site, page, dev } = useRenderContext();
  const publicPath = site.publicPath;
  const resources = getDocumentResources({ site, page }, props.assets);

  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        {resources.preScripts.map((script, i) => (
          <Script
            key={`pre-script-${i}`}
            script={script}
            publicPath={publicPath}
          />
        ))}
        <SeoMeta {...props} />
        {!props.noIndex && <OgMeta {...props} />}
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="icon" href={favicon} />
        {resources.preloadAssets.map((asset, i) => (
          <link
            key={`preload-${i}`}
            rel="preload"
            href={normalizeUrl(publicPath, asset.href)}
            as={asset.as}
            type={asset.type}
            crossOrigin={asset.crossOrigin}
            media={asset.media}
          />
        ))}
        {dev ? <script type="text/javascript" src={HMRClientScriptPath} /> : ''}
        {resources.styles.map((style, i) => (
          <link
            key={`style-${i}`}
            rel="stylesheet"
            type="text/css"
            href={normalizeUrl(publicPath, style.href)}
            media={style.media}
            crossOrigin={style.crossOrigin}
          />
        ))}
      </head>
      <body className={props.className}>
        {props.children}
        {resources.scripts.map((script, i) => (
          <Script
            key={`script-${i}`}
            script={script}
            publicPath={publicPath}
          />
        ))}
      </body>
    </html>
  );
}
