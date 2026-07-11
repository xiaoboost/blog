import { expect } from 'chai';
import { describe, it } from 'mocha';

import { compileStyles, mergeStyles, createFontFaceStyles } from '../compiler';

describe('snapshot — 综合场景', () => {
  it('空 class + 多 class + 数组值', () => {
    const s = compileStyles({
      postAnchor: {},
      postHeader: {},
      noIndent: {},
      postDefault: {
        color: 'var(--text)',
        width: 900,
        borderRadius: '4px',
        overflow: 'hidden',
        '&$noIndent': { width: '100%' },
        '& $postHeader': {
          display: 'flex',
          minHeight: 50,
          borderBottom: '1px solid var(--border)',
        },
      },
    });
    const c = s.classes;
    expect(s.toString()).to.equal(`.${c.postDefault} {
  color: var(--text);
  width: 900px;
  border-radius: 4px;
  overflow: hidden;
}
.${c.postDefault}.${c.noIndent} {
  width: 100%;
}
.${c.postDefault} .${c.postHeader} {
  display: flex;
  min-height: 50px;
  border-bottom: 1px solid var(--border);
}`);
  });

  it('深层嵌套：p / em / strong + 数组 + &&&', () => {
    const s = compileStyles({
      noIndent: {},
      postArticle: {
        '& p': {
          lineHeight: 1.75,
          textIndent: '2em',
          '&:last-child': { marginBottom: 0 },
          '&$noIndent': { textIndent: '0' },
        },
        '& em': {
          fontStyle: 'normal',
          '& > strong': {
            fontWeight: 'bold',
            padding: [
              0, 2, 2.5, 2,
            ],
          },
        },
      },
      subtitle: { '&&&': { display: 'flex' } },
    });
    const c = s.classes;
    expect(s.toString()).to.equal(`.${c.postArticle} p {
  line-height: 1.75;
  text-indent: 2em;
}
.${c.postArticle} p:last-child {
  margin-bottom: 0;
}
.${c.postArticle} p.${c.noIndent} {
  text-indent: 0;
}
.${c.postArticle} em {
  font-style: normal;
}
.${c.postArticle} em > strong {
  font-weight: bold;
  padding: 0 2px 2.5px 2px;
}
.${c.subtitle}.${c.subtitle}.${c.subtitle} {
  display: flex;
}`);
  });

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

  it('@font-face + mergeStyles', () => {
    const s = mergeStyles(
      createFontFaceStyles('"Lato"', 'normal', 'normal', '/fonts/Lato'),
      createFontFaceStyles('"Lato"', 'normal', 'bold', '/fonts/Lato-Bold'),
    );
    expect(s.toString()).to.equal(`@font-face {
  font-family: "Lato";
  font-style: normal;
  font-weight: normal;
  src: url('/fonts/Lato.woff2') format('woff2');
}
@font-face {
  font-family: "Lato";
  font-style: normal;
  font-weight: bold;
  src: url('/fonts/Lato-Bold.woff2') format('woff2');
}`);
  });

  it('@import + 同文件多类样式', () => {
    const s = compileStyles({
      '@import': "'highlight.js/styles/atom-one-light.css'",
      codeBlockLabel: {},
      codeBlockList: {},
      codeBlockWrapper: {
        fontSize: '0.9em',
        '& $codeBlockLabel': {
          position: 'absolute',
          right: 4,
          top: 4,
        },
        '& code$codeBlockList': {
          margin: 0,
          display: 'flex',
        },
      },
    } as any);
    const c = s.classes;
    expect(s.toString()).to.equal(`@import 'highlight.js/styles/atom-one-light.css'
.${c.codeBlockWrapper} {
  font-size: 0.9em;
}
.${c.codeBlockWrapper} .${c.codeBlockLabel} {
  position: absolute;
  right: 4px;
  top: 4px;
}
.${c.codeBlockWrapper} code.${c.codeBlockList} {
  margin: 0;
  display: flex;
}`);
  });

  it('多个 &$ 状态变体', () => {
    const s = compileStyles({
      invisible: {},
      visible: {},
      disable: {},
      slider: {},
      scrollbar: {
        '&$invisible': { opacity: 0 },
        '&$visible': { opacity: 1 },
        '&$disable': { display: 'none' },
        '& $slider': { width: 8 },
      },
    });
    const c = s.classes;
    expect(s.toString()).to.equal(`.${c.scrollbar}.${c.invisible} {
  opacity: 0;
}
.${c.scrollbar}.${c.visible} {
  opacity: 1;
}
.${c.scrollbar}.${c.disable} {
  display: none;
}
.${c.scrollbar} .${c.slider} {
  width: 8px;
}`);
  });
});
