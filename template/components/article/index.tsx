import './index.styl';

import React from 'react';

import { PropsWithChildren } from 'react';
import { Empty } from '@build/utils';

export function Article({ children }: PropsWithChildren<Empty>) {
  return (
    <article className='main-article-wrapper'>
      <div className='main-article'>
        {children}
      </div>
    </article>
  );
}
