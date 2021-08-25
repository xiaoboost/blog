import React from 'react';
import styles from './index.jss';

import { AssetData } from '@blog/utils';

export const assets: AssetData[] = require("./index.script").default;
export const ModuleName = process.env.ModuleName as string;

export function CodeBlockWrapper() {
  const { classes } = styles;

  return (
    <pre className={classes.codeBlockLsp}>
      测试
    </pre>
  );
}
