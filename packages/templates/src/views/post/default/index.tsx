import React from 'react';
import Moment from 'moment';

import { PostData } from 'src/loader/post';
import { Layout, LayoutProps } from 'src/template/components/layout';

interface Props {
  site: LayoutProps;
  post: PostData;
}

export function Template({ post, site }: Props) {
  return (
  <Layout {...site}>
    <section className='post-default'>
    <header className='post-header'>
      <h1 className='post-header__title'>{post.title}</h1>
      <time className='post-header__create'>{Moment(post.date).format('yyyy-MM-DD')}</time>
    </header>
    <article
      className='post-article'
      dangerouslySetInnerHTML={{ __html: post.html }}
    />
    </section>
  </Layout>
  )
}
