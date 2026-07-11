import { expect } from 'chai';
import { describe, it } from 'mocha';

import { generateClassName } from '../classname';

describe('generateClassName — 类名生成', () => {
  it('产出 kebab-case + 6 位 hash 后缀', () => {
    const name = generateClassName('postDefault');
    expect(name).to.match(/^post-default-[a-z0-9]{6}$/);
  });

  it('确定性 — 相同输入始终相同', () => {
    expect(generateClassName('postDefault')).to.equal(generateClassName('postDefault'));
  });

  it('不同 key 产出不同类名', () => {
    expect(generateClassName('a')).not.to.equal(generateClassName('b'));
  });

  it('带 salt 时产出不同 hash', () => {
    const withoutSalt = generateClassName('btn');
    const withSalt = generateClassName('btn', 'some-salt');
    expect(withSalt).not.to.equal(withoutSalt);
  });

  it('相同 salt + 相同 key 确定性一致', () => {
    expect(generateClassName('btn', 's')).to.equal(generateClassName('btn', 's'));
  });

  it('不同 salt + 相同 key 产出不同 hash', () => {
    expect(generateClassName('btn', 'a')).not.to.equal(generateClassName('btn', 'b'));
  });
});
