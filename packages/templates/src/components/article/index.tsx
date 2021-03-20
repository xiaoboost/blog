import React from 'react';

import { PropsWithChildren } from 'react';
import { EmptyObject } from '@blog/utils';

export function Article({ children }: PropsWithChildren<EmptyObject>) {
  return (
    <article className='main-article-wrapper'>
      <div className='main-article'>
        {children}
      </div>
    </article>
  );
}
