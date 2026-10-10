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

test('三项的对象、对象解构、数组解构和 JSX 属性可以保持一行', () => {
  for (const code of [
    'const value = { a: 1, b: 2, c: 3 };\n',
    'const { a, b, c } = source;\n',
    'const [a, b, c] = source;\n',
    'const value = [1, 2, 3];\n',
    'const view = <div id="a" role="group" className="b" />;\n',
  ]) {
    assert.equal(fix(code), code);
  }
});

test('四项的对象字面量每个属性独占一行', () => {
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

test('普通解构及函数参数中的对象解构都执行四项换行规则', () => {
  const output = fix('const { a, b, c, d } = source;\n');
  for (const key of [
    'a',
    'b',
    'c',
    'd',
  ]) {
    assert.match(output, new RegExp(`^  ${key},$`, 'm'));
  }
  const parameter = fix('function Example({ a, b, c = 0, ...rest }: Props) { return rest; }\n');
  assert.match(parameter, /^  a,$/m);
  assert.match(parameter, /^  b,$/m);
  assert.match(parameter, /^  c = 0,$/m);
  assert.match(parameter, /^  \.\.\.rest$/m);
});

test('四项的数组字面量及数组解构逐项换行', () => {
  const literal = fix('const value = [1, 2, 3, 4];\n');
  const pattern = fix('const [a, b, c, ...rest] = source;\n');
  for (const value of [
    '1',
    '2',
    '3',
    '4',
  ]) {
    assert.match(literal, new RegExp(`^  ${value},$`, 'm'));
  }
  for (const key of ['a', 'b', 'c']) {
    assert.match(pattern, new RegExp(`^  ${key},$`, 'm'));
  }
  assert.match(pattern, /^  \.\.\.rest$/m);
});

test('四项 JSX 属性全部换行，展开属性也计入数量', () => {
  const output = fix('const view = <div id="a" role="group" className="b" {...props} />;\n');
  for (const name of ['id', 'role', 'className']) {
    assert.match(output, new RegExp(`^    ${name}=`, 'm'));
  }
  assert.match(output, /^    \{\.\.\.props\}$/m);
});

test('嵌套对象独立计数，换行修复保留注释及属性顺序', () => {
  const output = fix('const value = { nested: { a: 1, b: 2, c: 3, d: 4 }, count: 0 };\n');
  assert.match(output, /nested: \{\n/);
  assert.match(output, /count: 0/);
  const commented = fix('const { a, // keep\n b, c, ...rest } = source;\n');
  assert.match(commented, /a, \/\/ keep\n/);
  assert.ok(commented.indexOf('b,') < commented.indexOf('c,'));
  assert.ok(commented.indexOf('c,') < commented.indexOf('...rest'));
});

test('自动修复保留 Node ESM 必需的 index.mjs 文件名', () => {
  const code = "export { default } from './index.mjs';\n";
  assert.equal(fix(code, 'src/example.mjs'), code);
});

test('if、else if 和 else 的单条语句都补齐花括号及关键词空格', () => {
  const code = 'function check(value) { if(value === 1) return 1; else if(value === 2) return 2; else return 0; }\n';
  assert.equal(fix(code), `function check(value) {
  if (value === 1) {
    return 1;
  }
  else if (value === 2) {
    return 2;
  }
  else {
    return 0;
  }
}
`);
});

test('if 前后与相邻 if 之间留空行，块首尾不额外添加空行', () => {
  const code = 'function check(value) { const result = value; if(value) return result; if(!value) throw new Error(\'missing\'); return value; }\n';
  assert.equal(fix(code), `function check(value) {
  const result = value;

  if (value) {
    return result;
  }

  if (!value) {
    throw new Error('missing');
  }

  return value;
}
`);
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
