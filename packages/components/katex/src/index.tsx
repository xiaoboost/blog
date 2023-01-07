import React from 'react';
import Katex, { KatexOptions } from 'katex';
import { defineUtils } from '@blog/context/runtime';

import styles from './index.jss';
import assets from './katex.script';

interface Props {
  children: string;
  options?: KatexOptions;
}

const baseOptions: KatexOptions = {
  displayMode: true,
  output: 'html',
};

export function MathBlock({ children, options }: Props) {
  return (
    <p
      className={styles.classes.mathBlock}
      dangerouslySetInnerHTML={{
        __html: Katex.renderToString(children.trim(), {
          ...baseOptions,
          ...options,
          displayMode: true,
        }),
      }}
    />
  );
}

export function MathInline({ children, options }: Props) {
  return (
    <span
      className={styles.classes.mathInline}
      dangerouslySetInnerHTML={{
        __html: Katex.renderToString(children.trim(), {
          ...baseOptions,
          ...options,
          displayMode: false,
        }),
      }}
    />
  );
}

export const utils = defineUtils(assets);
