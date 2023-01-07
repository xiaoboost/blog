import { expect, describe, it } from '@blog/test-toolkit';
import { getImportCode } from '../transformer';

describe('getImportCode', () => {
  it('one post', () => {
    expect(
      `
import post_default_0, * as post_0_utils from '/xxx/xxx.mdx';
const post1 = {
  Component: post_default_0,
  ...post_0_utils,
};
`.trimStart(),
    ).eq(getImportCode('/xxx/xxx.mdx', 'post1'));
  });

  it('many post', () => {
    const code = Array(3)
      .fill(0)
      .reduce((ans, _, i) => ans + getImportCode(`/xxx/xxx${i}.mdx`, `post${i}`), '');

    expect(
      `
import post_1_default, * as post_1_utils from '/xxx/xxx0.mdx';
const post0 = {
  Component: post_1_default,
  ...post_1_utils,
};
import post_2_default, * as post_2_utils from '/xxx/xxx1.mdx';
const post1 = {
  Component: post_2_default,
  ...post_2_utils,
};
import post_3_default, * as post_3_utils from '/xxx/xxx2.mdx';
const post2 = {
  Component: post_3_default,
  ...post_3_utils,
};
`.trimStart(),
    ).eq(code);
  });
});
