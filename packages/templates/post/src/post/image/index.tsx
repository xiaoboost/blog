import { isUrl } from '@blog/shared';
import React from 'react';
import { usePageAsset } from '../../utils/asset';

import styles from './index.jss';

export interface Props {
  alt?: string;
  src: string;
}

export function img({ src, alt }: Props) {
  const finalPath = usePageAsset(src);

  // 预构建阶段不渲染
  if (!finalPath) return null;

  // 外部 URL 直出
  if (isUrl(src)) {
    return (
      <figure className={styles.classes.postImageBox}>
        <img className={styles.classes.postImageInner} src={src} alt={alt} />
        {alt && <figcaption className={styles.classes.postImageAlt}>{alt}</figcaption>}
      </figure>
    );
  }

  return (
    <figure className={styles.classes.postImageBox}>
      <img className={styles.classes.postImageInner} src={finalPath} alt={alt} />
      {alt && <figcaption className={styles.classes.postImageAlt}>{alt}</figcaption>}
    </figure>
  );
}
