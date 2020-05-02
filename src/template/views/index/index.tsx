import React from 'react';
import Moment from 'moment';

import { normalize } from 'src/utils/template';
import { Layout, LayoutProps } from 'src/template/components/layout';

interface PostProps {
    title: string;
    url: string;
    tags: string[];
    create: number;
    description: string;
}

function Post(post: PostProps) {
    return <section className='posts-list__item'>
        <header className='posts-list__item-title'>
            <a href={normalize(post.url)}>{post.title}</a>
        </header>
        <article className='posts-list__item-description'>{post.description}</article>
        <footer className='posts-list__item-footer'>
            <span className='posts-list__item-tags'>
                {post.tags.map((tag) => (
                    <a key={tag}>{tag}</a>
                ))}
            </span>
            <time>{Moment(post.create).format('yyyy-MM-DD')}</time>
        </footer>
    </section>;
}

interface Props extends LayoutProps {
    next: string | null;
    pre: string | null;
    posts: PostProps[];
}

export function Template(props: Props) {
    return (
        <Layout {...props}>
            <ul className='posts-list'>
                {(props.posts || []).map((post) => <Post key={post.create} {...post} />)}
            </ul>
        </Layout>
    )
}
