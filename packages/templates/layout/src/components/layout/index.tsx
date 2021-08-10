import './index.styl';

import React from 'react';

import { PropsWithChildren } from 'react';

import { Header, HeaderProps } from '../header';
import { Footer } from '../footer';
import { Article } from '../article';

import { parseUrl } from 'build/utils';

export interface LayoutProps extends HeaderProps {
  /** 网站标题 */
  siteTitle: string;
  /** 网页标题 */
  pageTitle: string;
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
  /** 样式文件列表 */
  styles: string[];
  /** 脚本文件列表 */
  scripts: string[];
  /** 插件列表 */
  plugins: string[];
}

import faviconPath from '../../assets/image/favicon.ico';

export function Layout(props: PropsWithChildren<LayoutProps>) {
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
        <meta
          name='viewport'
          content='width=device-width,initial-scale=1,maximum-scale=1'
        />
        <meta name='renderer' content='webkit' />
        <meta name='force-rendering' content='webkit' />
        <meta httpEquiv='X-UA-Compatible' content='IE=edge,chrome=1' />
        <link rel='short icon' href={faviconPath} />
        {props.styles.map((pathname, i) => (
          <link
            key={i}
            rel='stylesheet'
            type='text/css'
            href={parseUrl(props.publicPath, pathname)}
          />
        ))}
      </head>
      <body>
        <Header {...props} />
        <Article plugins={props.plugins}>
          {props.children}
        </Article>
        <Footer />
        {props.scripts.map((pathname, i) => (
          <script
            key={i}
            type='text/javascript'
            src={parseUrl(props.publicPath, pathname)}
          />
        ))}
      </body>
    </html>
  );
}
