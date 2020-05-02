import React from 'react';
import Moment from 'moment';

import { normalize } from 'src/utils/template';

import { Tags } from 'src/template/components/icons';
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
        <header className='posts-list__item-header'>
            <span>
                <a href={normalize(post.url)}>{post.title}</a>
            </span>
            <time>{Moment(post.create).format('yyyy-MM-DD')}</time>
        </header>
        <article className='posts-list__item-description'>{post.description}</article>
        {post.tags.length === 0 ? '' : <footer className='posts-list__item-footer'>
            <Tags />
            {post.tags.map((tag) => (
                <a key={tag}>{tag}</a>
            ))}
        </footer>}
    </section>;
}

interface PaginationPorps {
    next: string | null;
    pre: string | null;
}

function Pagination(props: PaginationPorps) {
    if (!props.next && !props.pre) {
        return <></>;
    }

    return <div className='pagination'>
        TODO: Pagination
    </div>;
}

interface Props extends LayoutProps, PaginationPorps {
    posts: PostProps[];
}

export function Template(props: Props) {
    return (
        <Layout {...props}>
            <div className='posts-list'>
                {(props.posts || []).map((post) => <Post key={post.create} {...post} />)}
            </div>
            <Pagination {...props} />
        </Layout>
    )
}
