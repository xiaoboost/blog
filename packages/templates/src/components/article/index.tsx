import React from 'react';

import { PropsWithChildren } from 'react';
import { Empty } from '@blog/utils';

export function Article({ children }: PropsWithChildren<Empty>) {
  return (
    <article className='main-article-wrapper'>
      <div className='main-article'>
        {children}
      </div>
    </article>
  );
}
