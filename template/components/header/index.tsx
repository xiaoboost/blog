import './index.styl';

import React from 'react';

import { parseUrl, stringifyClass } from '@build/utils';

export interface HeaderProps {
  /** 当前页面网址 */
  pathname: string;
  /** 网页标题 */
  siteTitle: string;
  /** 网站根路径 */
  publicPath: string;
  // /** 标签页面路径 */
  // tagPath: string;
  // /** 归档页面路径 */
  // archivePath: string;
}

export function Header(props: HeaderProps) {
  const location = parseUrl(props.publicPath, props.pathname);
  const indexHref = parseUrl(props.publicPath);
  const aboutHref = parseUrl(props.publicPath, '/posts/about/');
  // const tagHref = parseUrl(props.publicPath, props.tagPath);
  // const archiveHref = parseUrl(props.publicPath, props.archivePath);
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
      highlight: (
        location === '/posts/about/' ||
        location === '/posts/about/index.html'
      ),
    },
  ];

  return <header className='main-header-wrapper'>
    <span className='main-header'>
      <a className='main-title' href={indexHref}>
        {props.siteTitle}
      </a>
      <nav className='main-nav'>
        {navs.map((nav, i) => (
          <a
            key={i}
            href={nav.href}
            className={stringifyClass('main-nav__item', {
              'main-nav__item-highlight': nav.highlight,
            })}>
            {nav.name}
            {nav.highlight ? <span className='main-nav__item-bar' /> : ''}
          </a>
        ))}
      </nav>
    </span>
  </header>;
}
