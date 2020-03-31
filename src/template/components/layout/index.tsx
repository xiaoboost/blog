import React from 'react';

import { join } from 'path';
import { PropsWithChildren } from 'react';

import { Header } from '../header';
import { Footer } from '../footer';

interface Props {
    title: string;
    styleFile: string;
    scriptFile: string;
    publicPath: string;
}

export function Layout(props: PropsWithChildren<Props>) {
    return (
        <html lang='cmn-Hans-CN'>
            <head>
                <title>{props.title}</title>
                <meta name='charset' content='utf-8' />
                <meta name='X-UA-Compatible' content='IE=edge' />
                <meta name='viewport' content='width=device-width, initial-scale=1' />
                <link rel='short icon' href={join(props.publicPath, '/img/favicon.ico')} />
                <link rel='stylesheet' type='text/css' href={join(props.publicPath, props.styleFile)} />
            </head>
            <body>
                <Header />
                <article>
                    {props.children}
                </article>
                <Footer />
                <script type='text/javascript' src={join(props.publicPath, props.scriptFile)} />
            </body>
        </html>
    );
}
