import React from 'react';

import { normalizeUrl } from '@blog/node';
import { stringifyClass } from '@xiao-ai/utils';

import styles from './index.jss';

export interface HeaderProps {
  /** 当前页面网址 */
  pathname: string;
  /** 网页标题 */
  siteTitle: string;
  /** 网站根路径 */
  publicPath?: string;
  // /** 标签页面路径 */
  // tagPath: string;
  // /** 归档页面路径 */
  // archivePath: string;
}

export function Header(props: HeaderProps) {
  const publicPath = props.publicPath ?? '/';
  const location = normalizeUrl(publicPath, props.pathname);
  const indexHref = normalizeUrl(publicPath);
  const aboutHref = normalizeUrl(publicPath, '/posts/about/');
  // const tagHref = normalizeUrl(props.publicPath, props.tagPath);
  // const archiveHref = normalizeUrl(props.publicPath, props.archivePath);
  const navs = [
    {
      name: '首页',
      href: indexHref,
      highlight: location === '/' || location === '/index.html',
    },
    // {
    //   name: '归档',
    //   href: archiveHref,
    //   highlight: location.indexOf(archiveHref) === 0,
    // },
    // {
    //   name: '标签',
    //   href: tagHref,
    //   highlight: location.indexOf(tagHref) === 0,
    // },
    {
      name: '关于',
      href: aboutHref,
      highlight: location === '/posts/about/' || location === '/posts/about/index.html',
    },
  ];

  return (
    <header className={styles.classes.mainHeaderWrapper}>
      <span className={styles.classes.mainHeader}>
        <a className={styles.classes.mainTitle} href={indexHref}>
          {props.siteTitle}
        </a>
        <nav className={styles.classes.mainNav}>
          {navs.map((nav, i) => (
            <a
              key={i}
              href={nav.href}
              className={stringifyClass(styles.classes.mainNavItem, {
                [styles.classes.mainNavItemHighlight]: nav.highlight,
              })}
            >
              {nav.name}
              {nav.highlight ? <span className={styles.classes.mainNavItemBar} /> : ''}
            </a>
          ))}
        </nav>
      </span>
    </header>
  );
}
