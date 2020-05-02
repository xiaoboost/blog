import React from 'react';

import { PropsWithChildren } from 'react';

import { Header } from '../header';
import { Footer } from '../footer';

import { resolvePublic, normalize } from 'src/utils/template';

export interface LayoutProps {
    title: string;
    styleFile: string;
    scriptFile: string;
    location: string;
}

export function Layout(props: PropsWithChildren<LayoutProps>) {
    const faviconPath = resolvePublic('image/favicon.ico');
    const styleFile = resolvePublic(props.styleFile);
    const scriptFile = resolvePublic(props.scriptFile);
    const location = normalize(props.location);

    return (
        <html lang='zh-cmn-Hans-CN'>
            <head>
                <title>{props.title}</title>
                <meta name='charset' content='utf-8' />
                <meta name='author' content='xiao' />
                <meta name='description' content='xiao 的个人博客' />
                <meta name='X-UA-Compatible' content='IE=edge' />
                <meta name='viewport' content='width=device-width, initial-scale=1' />
                <link rel='short icon' href={faviconPath} />
                <link rel='stylesheet' type='text/css' href={styleFile} />
            </head>
            <body>
                <Header location={location} />
                <article className='page-article'>
                    {props.children}
                </article>
                <Footer />
                <script type='text/javascript' src={scriptFile} />
            </body>
        </html>
    );
}
