import './index.styl';

import React from 'react';

import { PropsWithChildren } from 'react';

import { GotoTop, pluginName } from '../../plugins/goto-top';

export interface Props {
  plugins: string[];
}

export function Article({ children, plugins }: PropsWithChildren<Props>) {
  return (
    <article className='main-article-wrapper'>
      <div className='main-article'>
        {children}
      </div>
      {plugins.includes(pluginName) && <GotoTop />}
    </article>
  );
}
