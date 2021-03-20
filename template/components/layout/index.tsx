import './index.styl';

import React from 'react';

import { PropsWithChildren } from 'react';

import { Header } from '../header';
import { Footer } from '../footer';
import { Article } from '../article';

import { parseUrl } from '@build/utils';

export interface LayoutProps {
  /** 网页标题 */
  title: string;
  /** 网页作者 */
  author?: string;
  /** 网页描述 */
  description?: string;
  /** 网页内容关键字 */
  keywords?: string[];
  /** 样式文件路径 */
  styleFile: string;
  /** 脚本文件路径 */
  scriptFile: string;
  /** 当前页面网址 */
  location: string;
  /** 网站根路径 */
  publicPath: string;
}

import faviconPath from '../../assets/image/favicon.ico';

export function Layout(props: PropsWithChildren<LayoutProps>) {
  const styleFile = parseUrl(props.publicPath, props.styleFile);
  const scriptFile = parseUrl(props.publicPath, props.scriptFile);

  return (
    <html lang='zh-cmn-Hans-CN'>
      <head>
        <title>{props.title}</title>
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
        <link rel='stylesheet' type='text/css' href={styleFile} />
      </head>
      <body>
        <Header {...props} />
        <Article>
          {props.children}
        </Article>
        <Footer />
        <script type='text/javascript' src={scriptFile} />
      </body>
    </html>
  );
}
