import React from 'react';
import styles from './index.jss';

import { AssetData } from '@blog/utils';

export const assets: AssetData[] = require("./index.script").default;
export const ModuleName = process.env.ModuleName as string;

export interface Props {
  lang?: string;
  code: string;
  children: string;
}

export function CodeBlockWrapper() {
  // ..
}

export function CodeBlock({ lang, code }: Props) {
  return (
    <pre className={styles.classes.codeBlock}>
    </pre>
  );
}

export function devApp() {
  return <div>
    <div>
      <CodeBlock lang="css" code={".test {\n  display: flex;\n}"}>
        {`
          .test {
            display: flex;
          }
        `.trim()}
      </CodeBlock>
    </div>
  </div>;
}
