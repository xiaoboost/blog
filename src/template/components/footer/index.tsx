import React from 'react';

export function Footer() {
    return (
        <footer className='main-footer'>
            <span>Powered by </span>
            <a href='https://github.com/xiaoboost' className='main-footer__href'>Xiao</a>
            <span> & </span>
            <a href='https://pages.github.com/' className='main-footer__href'>Github Pages</a>
            <span style={{ fontSize: '110%' }}> © </span>
            <span>Since 2020</span>
        </footer>
    );
}
