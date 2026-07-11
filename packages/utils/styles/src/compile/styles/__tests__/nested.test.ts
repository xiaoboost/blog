import { expect } from 'chai';
import { describe, it } from 'mocha';

import { resolveSelector } from '../nested';

const classMap = {
  child: 'child-hash',
  active: 'active-hash',
  title: 'title-hash',
};

describe('resolveSelector — 嵌套选择器解析', () => {
  it('&:pseudo — 替换 & 为父选择器', () => {
    expect(resolveSelector('&:hover', '.btn', classMap)).to.equal('.btn:hover');
    expect(resolveSelector('&:last-child', '.btn', classMap)).to.equal('.btn:last-child');
    expect(resolveSelector('&:nth-child(2n+1)', '.btn', classMap)).to.equal('.btn:nth-child(2n+1)');
  });

  it('&::pseudo-element — 伪元素', () => {
    expect(resolveSelector('&::before', '.btn', classMap)).to.equal('.btn::before');
    expect(resolveSelector('&::after', '.btn', classMap)).to.equal('.btn::after');
  });

  it('&$class — 同元素多类组合', () => {
    expect(resolveSelector('&$active', '.btn', classMap)).to.equal('.btn.active-hash');
  });

  it('& $class — 子类引用', () => {
    expect(resolveSelector('& $child', '.btn', classMap)).to.equal('.btn .child-hash');
    expect(resolveSelector('& $title', '.box', classMap)).to.equal('.box .title-hash');
  });

  it('& tag — 后代选择器', () => {
    expect(resolveSelector('& p', '.btn', classMap)).to.equal('.btn p');
    expect(resolveSelector('& code', '.btn', classMap)).to.equal('.btn code');
    expect(resolveSelector('& > li', '.box', classMap)).to.equal('.box > li');
  });

  it('逗号分隔组合选择器', () => {
    expect(resolveSelector('&:hover, &:focus', '.btn', classMap)).to.equal('.btn:hover, .btn:focus');
    expect(resolveSelector('&::before, &::after', '.box', classMap)).to.equal('.box::before, .box::after');
    expect(resolveSelector('& code, & pre', '.box', classMap)).to.equal('.box code, .box pre');
  });

  it('&&& — 特异性 hack', () => {
    expect(resolveSelector('&&&', '.subtitle', classMap)).to.equal('.subtitle.subtitle.subtitle');
  });

  it('&:hover $child — 伪类 + 子引用组合', () => {
    expect(resolveSelector('&:hover $child', '.btn', classMap)).to.equal('.btn:hover .child-hash');
  });

  it('tag + $ref 组合', () => {
    expect(resolveSelector('& code$child', '.box', classMap)).to.equal('.box code.child-hash');
  });

  it('无 & 时隐式加父选择器前缀', () => {
    // 注意：这个场景在 JSS 中不常见，但作为防御性实现保留
    expect(resolveSelector(':hover', '.btn', classMap)).to.equal('.btn :hover');
  });

  it('父选择器含逗号时叉积展开', () => {
    // '.a ul, .a ol' + '& li' → '.a ul li, .a ol li'
    expect(resolveSelector('& li', '.a ul, .a ol', classMap)).to.equal('.a ul li, .a ol li');
  });

  it('两层逗号叉积', () => {
    // '.a ul, .a ol' + '&:last-child' → '.a ul:last-child, .a ol:last-child'
    expect(resolveSelector('&:last-child', '.a ul, .a ol', classMap)).to.equal('.a ul:last-child, .a ol:last-child');
  });

  it('嵌套自身也含逗号 + 父含逗号 → 叉积', () => {
    // '.a, .b' + '& li, & p' → '.a li, .a p, .b li, .b p'
    expect(resolveSelector('& li, & p', '.a, .b', classMap)).to.equal('.a li, .a p, .b li, .b p');
  });
});
