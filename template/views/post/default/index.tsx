import './index.styl';

import React from 'react';
import Moment from 'moment';
import type Token from 'markdown-it/lib/token';

import { Layout, LayoutProps } from '@template/components/layout';
import { ToContent, pluginName } from '@template/plugins/to-content';

export interface Props extends LayoutProps {
  /** 文章本体 */
  post: string;
  /** 文章分词数据 */
  tokens: Token[];
  /** 文章写作时间戳 */
  create: number;
  /** 文章标题 */
  articleTitle: string;
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
        {props.plugins.includes(pluginName) && <ToContent tokens={props.tokens} />}
      </section>
    </Layout>
  )
}
