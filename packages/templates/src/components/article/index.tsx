import React from 'react';

import { PropsWithChildren } from 'react';

export function Article({ children }: PropsWithChildren<{}>) {
  return (
  <article className='main-article-wrapper'>
    <div className='main-article'>
    {children}
    </div>
  </article>
  );
}
