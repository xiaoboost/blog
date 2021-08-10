import React from 'react';
import Katex from 'katex';
import styles from './index.jss';

import type { AssetData } from '@blog/utils';

export const assets: AssetData[] = require("./index.script").default;

interface Props {
  value: string;
  options?: Katex.KatexOptions;
}

const baseOptions: Katex.KatexOptions = {
  displayMode: true,
  output: 'html',
};

export function MathBlock({ value, options }: Props) {
  return <p
    className={styles.classes.mathBlock}
    dangerouslySetInnerHTML={{
      __html: Katex.renderToString(value.trim(), {
        ...baseOptions,
        ...options,
        displayMode: true,
      }),
    }}
  />;
}

export function MathInline({ value, options }: Props) {
  return <span
    className={styles.classes.mathInline}
    dangerouslySetInnerHTML={{
      __html: Katex.renderToString(value.trim(), {
        ...baseOptions,
        ...options,
        displayMode: false,
      }),
    }}
  />;
}

export function devApp() {
  return <div>
    <div>
      <MathBlock value={`
        \\left\\{\\begin{matrix}
        x_2=cos\\theta(x_1+y_1\\cdot tan\\theta)\\\\
        y_2=cos\\theta(y_1-x_1\\cdot tan\\theta)
        \\end{matrix}\\right.
      `} />
    </div>
    <div>
      将<MathInline value='(x_1, y_1)' />
      旋转<MathInline value='\theta' />
      度之后到<MathInline value='(x_2, y_2)' />的过程
    </div>
  </div>;
}
