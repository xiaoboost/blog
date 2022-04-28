import React from 'react';
import styles from './index.jss';

export function Footer() {
  return (
    <footer className={styles.classes.mainFooter}>
      <span>Powered by </span>
      <a href='https://github.com/xiaoboost' className={styles.classes.mainFooterHref}>
        Xiao
      </a>
      <span> & </span>
      <a href='https://pages.github.com/' className={styles.classes.mainFooterHref}>
        Github Pages
      </a>
      <span style={{ fontSize: '110%' }}> © </span>
      <span>Since 2020</span>
    </footer>
  );
}
