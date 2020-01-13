import Markdown from 'markdown-it';

import MarkdownSub from 'markdown-it-sub';
import MarkdownSup from 'markdown-it-sup';
import MarkdownMark from 'markdown-it-mark';
import MarkdownKatex from 'markdown-it-katex';
import MarkdownAttrs from 'markdown-it-attrs';
import MarkdownFootnote from 'markdown-it-footnote';
import MarkdownContainer from 'markdown-it-container';

export const markdown = (
    new Markdown()
        .use(MarkdownSub)
        .use(MarkdownSup)
        .use(MarkdownMark)
        .use(MarkdownKatex)
        .use(MarkdownAttrs, {
            leftDelimiter: '{',
            rightDelimiter: '}',
            allowedAttributes: ['id', 'class'],
        })
        .use(MarkdownFootnote)
        .use(MarkdownContainer)
);
