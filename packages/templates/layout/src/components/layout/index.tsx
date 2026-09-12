import { ScrollBar } from '@blog/component-scrollbar';
import { normalizeUrl } from '@blog/node';
import { HMRClientScriptPath } from '@blog/shared';
import type { PreloadAssetData } from '@blog/types';
import { default as React, type PropsWithChildren } from 'react';

import favicon from '../../assets/images/favicon.ico';
import { Footer } from '../footer';
import { GotoTop } from '../goto-top';
import { type HeaderProps, Header } from '../header';
import { type MainContentProps, MainContent } from '../main-content';
import { OgMeta } from './og-meta';
import { SeoMeta } from './seo-meta';

export interface LayoutProps extends HeaderProps, MainContentProps {
  /** 网站标题 */
  siteTitle: string;
  /** 网页标题 */
  pageTitle: string;
  /** 是否启用 HMR */
  hmr?: boolean;
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
  /** 当前页面网址 */
  pathname: string;
  /** 网站根路径 */
  publicPath: string;
  /** 样式资源列表 */
  styles: string[];
  /** 脚本资源列表 */
  scripts: string[];
  /** 预加载资源列表 */
  preloadAssets: PreloadAssetData[];
}

export function Layout(props: PropsWithChildren<LayoutProps>) {
  const publicPath = props.publicPath ?? '/';

  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <SeoMeta {...props} />
        <OgMeta {...props} />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="icon" href={favicon} />
        {(props.preloadAssets ?? []).map((asset, i) => (
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
        {props.hmr ? <script type="text/javascript" src={HMRClientScriptPath} /> : ''}
        {props.styles.map((pathname, i) => (
          <link
            key={`style-${i}`}
            rel="stylesheet"
            type="text/css"
            href={normalizeUrl(publicPath, pathname)}
          />
        ))}
      </head>
      <body>
        <Header {...props} />
        <MainContent bodyClassName={props.bodyClassName}>{props.children}</MainContent>
        <Footer />
        <GotoTop />
        <ScrollBar width={8} mode="y" />
        {props.scripts.map((pathname, i) => (
          <script
            key={`script-${i}`}
            type="text/javascript"
            src={normalizeUrl(publicPath, pathname)}
          />
        ))}
      </body>
    </html>
  );
}
