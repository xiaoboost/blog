import { expect } from 'chai';
import { describe, it } from 'mocha';

import { normalizeKey, normalizeValue } from '../normalize';

describe('normalizeKey — 属性名转换', () => {
  it('camelCase 转 kebab-case', () => {
    expect(normalizeKey('backgroundColor')).to.equal('background-color');
    expect(normalizeKey('fontSize')).to.equal('font-size');
    expect(normalizeKey('marginLeft')).to.equal('margin-left');
    expect(normalizeKey('borderTopLeftRadius')).to.equal('border-top-left-radius');
  });

  it('CSS 自定义属性原样保留', () => {
    expect(normalizeKey('--my-var')).to.equal('--my-var');
  });

  it('已是 kebab-case 的不再转换', () => {
    expect(normalizeKey('display')).to.equal('display');
    expect(normalizeKey('text-align')).to.equal('text-align');
  });
});

describe('normalizeValue — 属性值规范化', () => {
  it('裸数字补 px（尺寸类属性）', () => {
    expect(normalizeValue('width', 100)).to.equal('100px');
    expect(normalizeValue('fontSize', 14)).to.equal('14px');
    expect(normalizeValue('marginLeft', 8)).to.equal('8px');
    expect(normalizeValue('paddingRight', 10)).to.equal('10px');
  });

  it('0 值不补 px', () => {
    expect(normalizeValue('width', 0)).to.equal('0');
    expect(normalizeValue('margin', 0)).to.equal('0');
  });

  it('无单位属性不补任何后缀', () => {
    expect(normalizeValue('opacity', 0.5)).to.equal('0.5');
    expect(normalizeValue('zIndex', 10)).to.equal('10');
    expect(normalizeValue('fontWeight', 600)).to.equal('600');
    expect(normalizeValue('lineHeight', 1.5)).to.equal('1.5');
    expect(normalizeValue('flexGrow', 1)).to.equal('1');
  });

  it('数组值展开为空格分隔', () => {
    expect(normalizeValue('padding', [10, 24])).to.equal('10px 24px');
    expect(normalizeValue('margin', [0, 2])).to.equal('0 2px');
    expect(normalizeValue('margin', [
      0, 10, 20, 10,
    ])).to.equal('0 10px 20px 10px');
  });

  it('字符串值原样返回', () => {
    expect(normalizeValue('color', 'red')).to.equal('red');
    expect(normalizeValue('display', 'flex')).to.equal('flex');
  });
});
