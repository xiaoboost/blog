import './index.styl';

import React from 'react';

import { parseUrl, stringifyClass } from '@build/utils';

interface Props {
  /** 当前页面网址 */
  location: string;
  /** 网页标题 */
  title: string;
  /** 网站根路径 */
  publicPath: string;
  // /** 标签页面路径 */
  // tagPath: string;
  // /** 归档页面路径 */
  // archivePath: string;
}

export function Header(props: Props) {
  const indexHref = parseUrl(props.publicPath);
  const aboutHref = parseUrl(props.publicPath, '/posts/about/');
  // const tagHref = parseUrl(props.publicPath, props.tagPath);
  // const archiveHref = parseUrl(props.publicPath, props.archivePath);
  const navs = [
    {
      name: '首页',
      href: indexHref,
      highlight: props.location === '/' || props.location === '/index.html',
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
        props.location === '/posts/about/' ||
        props.location === '/posts/about/index.html'
      ),
    },
  ];

  return <header className='main-header-wrapper'>
    <span className='main-header'>
      <a className='main-title' href={indexHref}>
        {props.title}
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
