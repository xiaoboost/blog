import React from 'react';
import styles from './index.jss';

export interface Props {
  alt?: string;
  src: string;
}

export function img(props: Props) {
  return (
    <figure className={styles.classes.postImageBox}>
      <img src={props.src} alt={props.alt} className={styles.classes.postImageInner} />
      {props.alt && <figcaption className={styles.classes.postImageAlt}>{props.alt}</figcaption>}
    </figure>
  );
}
