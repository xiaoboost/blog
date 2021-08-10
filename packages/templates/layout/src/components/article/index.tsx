import './index.styl';

import React from 'react';

import { PropsWithChildren } from 'react';
import { EmptyObject } from '@xiao-ai/utils';

// import { GotoTop, pluginName } from 'template/plugins/goto-top';

// export interface Props {
//   plugins: string[];
// }

export function Article({ children }: PropsWithChildren<EmptyObject>) {
  return (
    <article className='main-article-wrapper'>
      <div className='main-article'>
        {children}
      </div>
      {/* <GotoTop /> */}
    </article>
  );
}
