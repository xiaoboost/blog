import { describe, expect, it } from '@blog/test-toolkit';

import { compileStyles } from '../compiler';

describe('snapshot — 综合场景', () => {
  it('逗号选择器 + 叉积展开', () => {
    const s = compileStyles({
      splitMark: {},
      postArticle: {
        '& ul, & ol': {
          lineHeight: 1.5,
          '& li': { marginBottom: '0.2em' },
        },
        '& code, & pre': {
          fontFamily: 'monospace',
        },
        '& $splitMark': {
          '&::before, &::after': {
            content: '""',
            width: 80,
            height: 1,
          },
        },
      },
    });
    const c = s.classes;
    expect(s.toString()).to.equal(`.${c.postArticle} ul, .${c.postArticle} ol {
  line-height: 1.5;
}
.${c.postArticle} ul li, .${c.postArticle} ol li {
  margin-bottom: 0.2em;
}
.${c.postArticle} code, .${c.postArticle} pre {
  font-family: monospace;
}
.${c.postArticle} .${c.splitMark}::before, .${c.postArticle} .${c.splitMark}::after {
  content: "";
  width: 80px;
  height: 1px;
}`);
  });

  it('@media hoisting + &:hover 嵌套', () => {
    const s = compileStyles({
      codeBlockBox: {},
      codeBlockWrapper: {
        position: 'relative',
        '@media (max-width: 900px)': {
          marginLeft: '-14px',
          marginRight: '-14px',
          '& $codeBlockBox': {
            display: 'inline-flex',
            '&:hover': { opacity: 0.8 },
          },
        },
      },
    });
    const c = s.classes;
    expect(s.toString()).to.equal(`.${c.codeBlockWrapper} {
  position: relative;
}
@media (max-width: 900px) {
  .${c.codeBlockWrapper} {
    margin-left: -14px;
    margin-right: -14px;
  }
  .${c.codeBlockWrapper} .${c.codeBlockBox} {
    display: inline-flex;
  }
  .${c.codeBlockWrapper} .${c.codeBlockBox}:hover {
    opacity: 0.8;
  }
}`);
  });

  it('@global + 嵌套 @media (prefers-color-scheme)', () => {
    const s = compileStyles({
      '@global': {
        'html, body': { width: '100%', margin: 0 },
        a: {
          color: 'var(--link)',
          '&:hover, &:focus': { color: 'var(--link-hover)' },
        },
        body: {
          display: 'flex',
          '&::-webkit-scrollbar': { width: '0 !important' },
        },
        '@media (prefers-color-scheme: dark)': {
          ':root': { '--bg': 'black' },
          a: { color: 'var(--link-dark)' },
        },
      },
    });
    expect(s.classes).to.be.empty;
    expect(s.toString()).to.equal(`html, body {
  width: 100%;
  margin: 0;
}
a {
  color: var(--link);
}
a:hover, a:focus {
  color: var(--link-hover);
}
body {
  display: flex;
}
body::-webkit-scrollbar {
  width: 0 !important;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: black;
  }
  a {
    color: var(--link-dark);
  }
}`);
  });
});
