import React from 'react';

import { site } from 'src/config/site';
import { resolvePublic } from 'src/utils/template';
import { tagsPath, archivePath } from 'src/config/project';

export function Header() {
    return <header className='page-header-wrapper'>
        <span className='page-header'>
            <span className='header-title'>
                <a className='site-logo' href={resolvePublic()}>
                    <img className='site-logo-img' src={resolvePublic('image/logo.png')} />
                </a>
                <span className='site-title'>{site.title}</span>
            </span>
            <span className='header-action'>
                <a href={resolvePublic(archivePath, '/')} className='header-action-name'>归档</a>
                <a href={resolvePublic(tagsPath, '/')} className='header-action-name'>标签</a>
            </span>
        </span>
    </header>;
}
