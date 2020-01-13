import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import * as fs from 'fs-extra';
import * as util from './utils';
import * as config from './config';

import { Post } from 'template/views/post';

function fixHtml(content: string) {
    return '<!DOCTYPE html>' + content;
}

export async function render() {
    const content = fixHtml(renderToString(createElement(Post, {
        ...config,
        article: '文章内容',
    })));

    console.log(content);
}
