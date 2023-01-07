import React from 'react';

import { PropsWithChildren } from 'react';
import { normalizeUrl } from '@blog/node';

import { ScrollBar } from '@blog/component-scrollbar';
import { HMRClientScriptPath } from '@blog/shared';
import { Header, HeaderProps } from '../header';
import { Footer } from '../footer';
import { Article } from '../article';
import { GotoTop } from '../goto-top';

import favicon from '../../assets/image/favicon.ico';

export interface LayoutProps extends HeaderProps {
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
  /** 当前页面网址 */
  pathname: string;
  /** 网站根路径 */
  publicPath: string;
  /** 样式资源列表 */
  styles: string[];
  /** 脚本资源列表 */
  scripts: string[];
}

export function Layout(props: PropsWithChildren<LayoutProps>) {
  const publicPath = props.publicPath ?? '/';

  return (
    <html lang='zh-cmn-Hans-CN'>
      <head>
        <title>{props.pageTitle}</title>
        <meta name='charset' content='utf-8' />
        {props.author && <meta name='author' content={props.author} />}
        {props.description && <meta name='description' content={props.description} />}
        {(props.keywords ?? []).length > 0 && (
          <meta name='keywords' content={props.keywords?.join(',')} />
        )}
        <meta name='viewport' content='width=device-width,initial-scale=1,maximum-scale=1' />
        <meta name='renderer' content='webkit' />
        <meta name='force-rendering' content='webkit' />
        <meta httpEquiv='X-UA-Compatible' content='IE=edge,chrome=1' />
        <link rel='short icon' href={favicon} />
        {props.hmr ? <script type='text/javascript' src={HMRClientScriptPath} /> : ''}
        {props.styles.map((pathname, i) => (
          <link
            key={i}
            rel='stylesheet'
            type='text/css'
            href={normalizeUrl(publicPath, pathname)}
          />
        ))}
      </head>
      <body>
        <Header {...props} />
        <Article>{props.children}</Article>
        <Footer />
        <GotoTop />
        <ScrollBar width={8} mode='y' />
        {props.scripts.map((pathname, i) => (
          <script key={i} type='text/javascript' src={normalizeUrl(publicPath, pathname)} />
        ))}
      </body>
    </html>
  );
}
