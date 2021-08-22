import React from 'react';
import favicon from './assets/image/favicon.ico';

import { PropsWithChildren } from 'react';

import { Header, HeaderProps } from './components/header';
import { Footer } from './components/footer';
import { Article } from './components/article';

import { parseUrl } from '@blog/utils';
import { AssetData } from '@blog/utils';

export const assets: AssetData[] = [
  ...require('./index.script').default,
  favicon,
];

export const ModuleName = process.env.ModuleName as string;

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
  publicPath?: string;
  /** 样式文件列表 */
  styles?: string[];
  /** 脚本文件列表 */
  scripts?: string[];
}

export function Layout(props: PropsWithChildren<LayoutProps>) {
  const styles = props.styles ?? [];
  const scripts = props.scripts ?? [];
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
        <meta
          name='viewport'
          content='width=device-width,initial-scale=1,maximum-scale=1'
        />
        <meta name='renderer' content='webkit' />
        <meta name='force-rendering' content='webkit' />
        <meta httpEquiv='X-UA-Compatible' content='IE=edge,chrome=1' />
        <link rel='short icon' href={favicon.path} />
        {styles.map((pathname, i) => (
          <link
            key={i}
            rel='stylesheet'
            type='text/css'
            href={parseUrl(publicPath, pathname)}
          />
        ))}
      </head>
      <body>
        <Header {...props} />
        <Article>
          {props.children}
        </Article>
        <Footer />
        {scripts.map((pathname, i) => (
          <script
            key={i}
            type='text/javascript'
            src={parseUrl(publicPath, pathname)}
          />
        ))}
      </body>
    </html>
  );
}

export function devApp() {
  const findAssets = (ext: string) => {
    return assets.filter((item) => item.path.endsWith(ext)).map(({ path }) => path);
  };

  return <Layout
    siteTitle='Site Title'
    pageTitle='Page Title'
    pathname='/index.html'
    styles={findAssets('.css')}
    scripts={findAssets('.js')}
  >
    网站内容
  </Layout>;
}
