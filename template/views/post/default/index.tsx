import './index.styl';

import React from 'react';
import Moment from 'moment';

import { Layout, LayoutProps } from '@template/components/layout';

export interface Props extends LayoutProps {
  /** 文章本体 */
  post: string;
  /** 文章写作时间戳 */
  create: number;
}

export function Render(props: Props) {
  return (
    <Layout {...props}>
      <section className='post-default'>
        <header className='post-header'>
          <h1 className='post-header__title'>{props.articleTitle}</h1>
          <time className='post-header__create'>
            {Moment(props.create).format('yyyy-MM-DD')}
          </time>
        </header>
        <article
          className='post-article'
          dangerouslySetInnerHTML={{ __html: props.post }}
        />
      </section>
    </Layout>
  )
}
