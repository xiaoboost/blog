import React from 'react';

import { PropsWithChildren } from 'react';

import { Header } from '../header';
import { Footer } from '../footer';
import { Article } from '../article';

import { site } from 'src/config/site';

import { resolvePublic, normalize } from 'src/utils/template';

export interface LayoutProps {
    title: string;
    author?: string;
    description?: string;
    keywords?: string[];
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
                <meta name='author' content={props.author || site.author} />
                <meta name='description' content={props.description || site.description} />
                {(props.keywords || []).length > 0 ? <meta name='keywords' content={props.keywords?.join(',')} /> : ''}
                <meta name='viewport' content='width=device-width,initial-scale=1,maximum-scale=1' />
                <meta name='renderer' content='webkit' />
                <meta name='force-rendering' content='webkit' />
                <meta httpEquiv='X-UA-Compatible' content='IE=edge,chrome=1' />
                <link rel='short icon' href={faviconPath} />
                <link rel='stylesheet' type='text/css' href={styleFile} />
            </head>
            <body>
                <Header location={location} />
                <Article>
                    {props.children}
                </Article>
                <Footer />
                <script type='text/javascript' src={scriptFile} />
            </body>
        </html>
    );
}
