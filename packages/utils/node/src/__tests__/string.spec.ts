import { expect, describe, it } from '@blog/test-toolkit';
import { toPinyin } from '../string';

describe('string', () => {
  it('toPinyin', async () => {
    expect(toPinyin('中文')).eq('zhong1-wen2');
    expect(toPinyin('test 测试')).eq('test-ce4-shi4');
    expect(toPinyin('test \n 测1试')).eq('test-ce4-1-shi4');
    expect(toPinyin('test测---试---实验')).eq('test-ce4-shi4-shi2-yan4');
  });
});
