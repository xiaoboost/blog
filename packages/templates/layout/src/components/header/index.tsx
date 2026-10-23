import { useRenderContext } from '@blog/context/runtime';
import { normalizeUrl } from '@blog/node';
import { stringifyClass } from '@xiao-ai/utils';
import React from 'react';
import { SiteTitleFontFamily } from '../../constant/font';
import { ThemeToggle } from '../theme-toggle';

import styles from './index.jss';

export function Header() {
  const { isPreBuild, site, page } = useRenderContext();
  const publicPath = site.publicPath;
  const location = normalizeUrl(publicPath, page.pathname);
  const indexHref = normalizeUrl(publicPath);
  const aboutHref = normalizeUrl(publicPath, site.aboutPath);
  const tagHref = normalizeUrl(publicPath, site.tagPath);
  const archiveHref = normalizeUrl(publicPath, site.archivePath);
  const navLists = [
    {
      name: '首页',
      href: indexHref,
      highlight: location === '/' || location === '/index.html',
    },
    {
      name: '标签',
      href: tagHref,
      highlight: location.indexOf(tagHref) === 0,
    },
    {
      name: '归档',
      href: archiveHref,
      highlight: location.indexOf(archiveHref) === 0,
    },
    {
      name: '关于',
      href: aboutHref,
      highlight: location === '/posts/about/' || location === '/posts/about/index.html',
    },
  ];

  /** 预构建阶段收集站点标题字体字符 */
  if (isPreBuild && site) {
    site.getFontBucket(SiteTitleFontFamily).addText(site.title);
  }

  return (
    <header className={styles.classes.mainHeaderWrapper}>
      <div className={styles.classes.mainHeader}>
        <a className={styles.classes.mainTitle} href={indexHref}>
          {site.title}
        </a>
        <nav className={styles.classes.mainNav} aria-label="主导航">
          {navLists.map((nav, i) => (
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
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
