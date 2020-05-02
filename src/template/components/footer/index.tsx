import React from 'react';

export function Footer() {
    return (
        <footer className='page-footer'>
            <span>Powered by </span>
            <a href='/' className='page-footer-author'>Xiao</a>
            <span> & </span>
            <a href='https://pages.github.com/' className='page-footer-author'>Github Pages</a>
            <span style={{ fontSize: '110%' }}> © </span>
            <span>Since 2020</span>
        </footer>
    );
}
