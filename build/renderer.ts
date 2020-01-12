import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import * as fs from 'fs-extra';
import * as util from './utils';
import * as project from './project';

import { Post } from '../template/views/post';

function fixHtml(content: string) {
    return '<!DOCTYPE html>' + content;
}

export async function render() {
    const content = fixHtml(renderToString(createElement(Post)));
    debugger;
}
