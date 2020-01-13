import { default as React, PropsWithChildren } from 'react';

import { Header } from '../header';
import { Footer } from '../footer';

interface Props {
    publicPath: string;
}

export function Layout({ children, publicPath }: PropsWithChildren<Props>) {
    return (
        <html lang='cmn-Hans-CN'>
            <head>
                <meta name='charset' content='utf-8' />
                <meta name='X-UA-Compatible' content='IE=edge' />
                <meta name='viewport' content='width=device-width, initial-scale=1' />
                <link rel='short icon' href={`${publicPath}img/favicon.ico`} />
            </head>
            <body>
                <Header />
                <article>
                    {children}
                </article>
                <Footer />
            </body>
        </html>
    );
}
