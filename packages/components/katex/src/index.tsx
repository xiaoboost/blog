import React from 'react';
import Katex, { KatexOptions } from 'katex';
import styles from './index.jss';
import assets = require('./katex.script');
import { getAssetContents, getAssetPaths } from '@blog/shared/node';

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

export const createAssets: CreateAssets = () => {
  return getAssetContents(assets);
};

export const getAssetNames: GetAssetNames = () => {
  return getAssetPaths(assets);
};