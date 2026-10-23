import { useRenderContext } from '@blog/context/runtime';
import { normalizeUrl } from '@blog/node';
import React from 'react';
import { Document } from '../../components/document';
import { ThemeToggle } from '../../components/theme-toggle';
import { SiteTitleFontFamily } from '../../constant/font';
import { Illustration } from './illustration';
import styles from './index.jss';
import assets from './not-found.script';

export function NotFound() {
  const { site, isPreBuild } = useRenderContext();
  const { classes } = styles;
  const home = normalizeUrl(site.publicPath);

  if (isPreBuild) {
    site.getFontBucket(SiteTitleFontFamily).addText(site.title);
  }

  return (
    <Document
      assets={assets}
      noIndex
      className={classes.page}
    >
      <header className={classes.masthead}>
        <a className={classes.brand} href={home} aria-label={`${site.title}，回到首页`}>
          {site.title}
        </a>
        <ThemeToggle />
      </header>
      <main className={classes.main} aria-labelledby="not-found-title">
        <Illustration />
        <h1 id="not-found-title" className={classes.title}>这一页，好像溜走了。</h1>
        <p className={classes.description}>可以回到首页，或者翻翻以前的文章。</p>
        <nav className={classes.actions} aria-label="继续浏览">
          <a className={classes.home} href={home}>回到首页</a>
          <a className={classes.archive} href={normalizeUrl(site.publicPath, site.archivePath)}>
            翻翻归档
            {' '}
            <span className={classes.arrow} aria-hidden="true">→</span>
          </a>
        </nav>
      </main>
    </Document>
  );
}
