import { expect } from 'chai';
import { describe, it } from 'mocha';

import { hash } from '../hash';

describe('hash — 确定性 hash', () => {
  it('相同输入始终产出相同 hash', () => {
    expect(hash('postDefault')).to.equal(hash('postDefault'));
  });

  it('不同输入产出不同 hash', () => {
    expect(hash('postDefault')).not.to.equal(hash('postHeader'));
  });

  it('单字符也能 hash，固定 6 位', () => {
    expect(hash('a')).to.be.a('string').with.lengthOf(6);
  });

  it('空字符串也能 hash，固定 6 位', () => {
    expect(hash('')).to.be.a('string').with.lengthOf(6);
  });

  it('路径 + 类名组合确定性', () => {
    expect(hash('/a/b.jss.ts:btn')).to.equal(hash('/a/b.jss.ts:btn'));
  });

  it('不同路径同 key 产出不同', () => {
    expect(hash('/a.jss.ts:btn')).not.to.equal(hash('/b.jss.ts:btn'));
  });
});
