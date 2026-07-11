import { expect } from 'chai';
import { describe, it } from 'mocha';

import { compileStyles, createFontFaceStyles, mergeStyles } from '../compiler';

// ═══════════════════════════════════════════════════════════════
// compileStyles — flat 属性
// ═══════════════════════════════════════════════════════════════

describe('compileStyles — 基础编译（flat 属性）', () => {
  it('单 class 单属性', () => {
    const s = compileStyles({ btn: { color: 'red' } });
    const c = s.classes.btn;
    expect(s.toString()).to.equal(`.${c} {
  color: red;
}`);
  });

  it('多 class 多属性', () => {
    const s = compileStyles({
      btn: { color: 'red', fontSize: 14 },
      box: { width: 200, height: 100 },
    });
    const b = s.classes.btn;
    const x = s.classes.box;
    expect(s.toString()).to.equal(`.${b} {
  color: red;
  font-size: 14px;
}
.${x} {
  width: 200px;
  height: 100px;
}`);
  });

  it('空 class（仅生成类名，不输出 CSS 规则）', () => {
    const s = compileStyles({
      btn: { color: 'red' },
      placeholder: {},
    });
    const c = s.classes.btn;
    expect(s.classes).to.have.keys('btn', 'placeholder');
    expect(s.toString()).to.equal(`.${c} {
  color: red;
}`);
  });

  it('数组值正确展开', () => {
    const s = compileStyles({ box: { padding: [10, 24] } });
    const c = s.classes.box;
    expect(s.toString()).to.equal(`.${c} {
  padding: 10px 24px;
}`);
  });

  it('确定性 — 相同输入相同输出', () => {
    const styles = { btn: { color: 'red', fontSize: 14 } };
    expect(compileStyles(styles).toString()).to.equal(compileStyles(styles).toString());
  });

  it('不同 styles 对象产出不同类名', () => {
    const a = compileStyles({ btn: { color: 'red' } });
    const b = compileStyles({ btn: { color: 'blue' } });
    expect(a.classes.btn).not.to.equal(b.classes.btn);
  });

  it('不同 styles 中同名 class 产出不同类名', () => {
    const a = compileStyles({ btn: { color: 'red' }, a: {} });
    const b = compileStyles({ btn: { color: 'red' }, b: {} });
    expect(a.classes.btn).not.to.equal(b.classes.btn);
  });

  it('完全相同 styles 产出相同类名', () => {
    const styles = { btn: { color: 'red', fontSize: 14 } };
    expect(compileStyles(styles).classes.btn).to.equal(compileStyles(styles).classes.btn);
  });
});

// ═══════════════════════════════════════════════════════════════
// compileStyles — 嵌套选择器
// ═══════════════════════════════════════════════════════════════

describe('compileStyles — 嵌套选择器编译', () => {
  it('&:hover', () => {
    const s = compileStyles({
      box: { color: 'blue', '&:hover': { color: 'green' } },
    });
    const c = s.classes.box;
    expect(s.toString()).to.equal(`.${c} {
  color: blue;
}
.${c}:hover {
  color: green;
}`);
  });

  it('&::before / &::after', () => {
    const s = compileStyles({
      el: {
        display: 'block',
        '&::before': { content: '""' },
        '&::after': { content: '""' },
      },
    });
    const c = s.classes.el;
    expect(s.toString()).to.equal(`.${c} {
  display: block;
}
.${c}::before {
  content: "";
}
.${c}::after {
  content: "";
}`);
  });

  it('&$class 同元素组合', () => {
    const s = compileStyles({
      btn: { color: 'red' },
      active: {},
      box: { '&$active': { color: 'blue' } },
    });
    const b = s.classes.btn;
    const x = s.classes.box;
    const a = s.classes.active;
    expect(s.toString()).to.equal(`.${b} {
  color: red;
}
.${x}.${a} {
  color: blue;
}`);
  });

  it('& $class 子类引用', () => {
    const s = compileStyles({
      parent: { '& $child': { color: 'red' } },
      child: {},
    });
    const p = s.classes.parent;
    const c = s.classes.child;
    expect(s.toString()).to.equal(`.${p} .${c} {
  color: red;
}`);
  });

  it('逗号组合选择器', () => {
    const s = compileStyles({
      box: { '&::before, &::after': { content: '""' } },
    });
    const c = s.classes.box;
    expect(s.toString()).to.equal(`.${c}::before, .${c}::after {
  content: "";
}`);
  });

  it('&&& 特异性', () => {
    const s = compileStyles({
      title: { '&&&': { display: 'flex' } },
    });
    const c = s.classes.title;
    expect(s.toString()).to.equal(`.${c}.${c}.${c} {
  display: flex;
}`);
  });

  it('> * 隐式嵌套选择器（不含 &）', () => {
    const s = compileStyles({
      box: {
        position: 'relative',
        '> *': { marginTop: 0, '&:last-child': { marginBottom: 0 } },
      },
    });
    const c = s.classes.box;
    expect(s.toString()).to.equal(`.${c} {
  position: relative;
}
.${c} > * {
  margin-top: 0;
}
.${c} > *:last-child {
  margin-bottom: 0;
}`);
  });
});

// ═══════════════════════════════════════════════════════════════
// compileStyles — @-规则
// ═══════════════════════════════════════════════════════════════

describe('compileStyles — @-规则编译', () => {
  it('@font-face', () => {
    const s = compileStyles({
      '@font-face': {
        fontFamily: '"Lato"',
        src: "url('/f.woff2') format('woff2')",
      },
    } as any);
    expect(s.toString()).to.equal(`@font-face {
  font-family: "Lato";
  src: url('/f.woff2') format('woff2');
}`);
  });

  it('@global: body & a', () => {
    const s = compileStyles({
      '@global': {
        body: { margin: 0 },
        a: { color: 'red' },
      },
    });
    expect(s.classes).to.be.empty;
    expect(s.toString()).to.equal(`body {
  margin: 0;
}
a {
  color: red;
}`);
  });

  it('@global 内嵌套 @media (prefers-color-scheme)', () => {
    const s = compileStyles({
      '@global': {
        ':root': { '--color': 'white' },
        '@media (prefers-color-scheme: dark)': {
          ':root': { '--color': 'black' },
        },
      },
    });
    expect(s.toString()).to.equal(`:root {
  --color: white;
}
@media (prefers-color-scheme: dark) {
  :root {
    --color: black;
  }
}`);
  });

  it('@media 嵌套在 class 内并 hoist', () => {
    const s = compileStyles({
      box: {
        width: 900,
        '@media (max-width: 900px)': { width: '100%' },
      },
    });
    const c = s.classes.box;
    expect(s.toString()).to.equal(`.${c} {
  width: 900px;
}
@media (max-width: 900px) {
  .${c} {
    width: 100%;
  }
}`);
  });

  it('@media 内嵌套 &:hover 正确 hoist', () => {
    const s = compileStyles({
      box: {
        color: 'blue',
        '@media (max-width: 900px)': {
          color: 'red',
          '&:hover': { color: 'green' },
        },
      },
    });
    const c = s.classes.box;
    expect(s.toString()).to.equal(`.${c} {
  color: blue;
}
@media (max-width: 900px) {
  .${c} {
    color: red;
  }
  .${c}:hover {
    color: green;
  }
}`);
  });

  it('顶层 @import（string 值）', () => {
    const s = compileStyles({
      '@import': "'highlight.js/styles/atom-one-light.css'",
    } as any);
    expect(s.toString()).to.equal(
      "@import 'highlight.js/styles/atom-one-light.css';",
    );
  });
});

// ═══════════════════════════════════════════════════════════════
// mergeStyles / createFontFaceStyles
// ═══════════════════════════════════════════════════════════════

describe('mergeStyles — 合并 StyleSheet', () => {
  it('合并两个 sheet 的 classes', () => {
    const a = compileStyles({ btn: { color: 'red' } });
    const b = compileStyles({ box: { width: 100 } });
    expect(mergeStyles(a, b).classes).to.have.keys('btn', 'box');
  });

  it('同名 class 后者覆盖前者', () => {
    const a = compileStyles({ btn: { color: 'red' } });
    const b = compileStyles({ btn: { color: 'blue' } });
    expect(mergeStyles(a, b).classes.btn).to.equal(b.classes.btn);
  });

  it('CSS 字符串拼接', () => {
    const a = compileStyles({ btn: { color: 'red' } });
    const b = compileStyles({ box: { width: 100 } });
    const m = mergeStyles(a, b);
    expect(m.toString()).to.equal(`.${a.classes.btn} {
  color: red;
}
.${b.classes.box} {
  width: 100px;
}`);
  });
});

describe('createFontFaceStyles — 字体声明', () => {
  it('生成 @font-face 规则', () => {
    const s = createFontFaceStyles('"Lato"', 'normal', 'bold', '/fonts/Lato-Bold');
    expect(s.toString()).to.equal(`@font-face {
  font-family: "Lato";
  font-style: normal;
  font-weight: bold;
  src: url('/fonts/Lato-Bold.woff2') format('woff2');
}`);
  });
});
