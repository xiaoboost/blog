import React from 'react';
import Moment from 'moment';

import { ToContent } from '../to-content';
import { Layout, LayoutProps } from '@blog/template-layout';

export interface Props extends LayoutProps {
  /** 文章标题 */
  postTitle: string;
  /** 文章本体 */
  post: string;
  /** 文章写作时间戳 */
  create: number;
  /** 是否开启目录 */
  toc?: boolean;
}

export function Post(props: Props) {
  return (
    <Layout {...props}>
      <section
        className='post-default'
        style={props ? undefined : { width: '100%' }}
      >
        <header className='post-header'>
          <h1 className='post-header__title'>{props.postTitle}</h1>
          <time className='post-header__create'>
            {Moment(props.create).format('yyyy-MM-DD')}
          </time>
        </header>
        <article
          className='post-article'
          dangerouslySetInnerHTML={{ __html: props.post }}
        />
      </section>
      {props.toc && <ToContent />}
    </Layout>
  )
}
