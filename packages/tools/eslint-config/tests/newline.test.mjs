import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Linter } from 'eslint';
import config from '../index.mjs';

const linter = new Linter();
const testConfig = [
  ...config,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@stylistic/max-len': 'off',
    },
  },
];

function fix(code, filename = 'src/example.tsx') {
  const options = { filename };
  const result = linter.verifyAndFix(code, testConfig, options);
  assert.deepEqual(result.messages, []);
  const repeated = linter.verifyAndFix(result.output, testConfig, options);
  assert.equal(repeated.fixed, false);
  assert.equal(repeated.output, result.output);
  assert.deepEqual(repeated.messages, []);
  return result.output;
}

test('对象字面量三项保持一行，四项开始逐项换行', () => {
  const compact = 'const value = { a: 1, b: 2, c: 3 };\n';
  assert.equal(fix(compact), compact);
  const output = fix('const value = { a: 1, b: 2, c: 3, d: 4 };\n');
  for (const key of [
    'a',
    'b',
    'c',
    'd',
  ]) {
    assert.match(output, new RegExp(`^  ${key}:`, 'm'));
  }
});

test('自动修复保留 Node ESM 必需的 index.mjs 文件名', () => {
  const code = "export { default } from './index.mjs';\n";
  assert.equal(fix(code, 'src/example.mjs'), code);
});

test('嵌套 if 补齐花括号后保留 else 原本所属的条件', () => {
  const code = 'function check(a, b) { if(a) if(b) return 1; else return 2; return 3; }\n';
  assert.equal(fix(code), `function check(a, b) {
  if (a) {
    if (b) {
      return 1;
    }
    else {
      return 2;
    }
  }

  return 3;
}
`);
});

test('三项以内的单行命名导入和导出保持原样', () => {
  for (const code of [
    "import { a, b, c } from 'source';\n",
    "import Main, { a, b, c } from 'source';\n",
    "export { a, b, c } from 'source';\n",
  ]) {
    assert.equal(fix(code), code);
  }
});

test('混合 type 和别名的多行导入补齐首尾花括号换行', () => {
  const code = `import { type WrapperProps,
  styles as normalStyles,
  CodeBlockWrapper,
  getHighlightCode,
  getMinSpaceWidth } from '@blog/mdx-code-block-normal';
`;
  assert.equal(fix(code), `import {
  type WrapperProps,
  styles as normalStyles,
  CodeBlockWrapper,
  getHighlightCode,
  getMinSpaceWidth,
} from '@blog/mdx-code-block-normal';
`);
});

test('命名导入和导出超过三项时每项独占一行', () => {
  for (const keyword of ['import', 'export']) {
    const code = `${keyword} { a, b, c, d } from 'source';\n`;
    assert.equal(fix(code), `${keyword} {
  a,
  b,
  c,
  d,
} from 'source';
`);
  }
});

test('已换行的三项命名列表也逐项换行并保留项间注释', () => {
  for (const keyword of ['import', 'export']) {
    const code = `${keyword} {
  a, /* keep */ b, c,
} from 'source';
`;
    assert.equal(fix(code), `${keyword} {
  a, /* keep */
  b,
  c,
} from 'source';
`);
  }
});
