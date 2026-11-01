import { describe, expect, it } from '@blog/test-toolkit';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Eyebrow } from '../typo';
import styles from '../typo/index.jss';

describe('Eyebrow 的作者约定', () => {
  it('作为引导短句输出段落，默认 16px 间距来自 CSS', () => {
    const html = renderToStaticMarkup(<Eyebrow>先看规模</Eyebrow>);
    expect(html).match(/^<p\b/).include(styles.classes.eyebrow).not.include('style=');
    expect(styles.toString()).include('margin: 0;').include('margin-bottom: 16px;');
    expect(html).include('先看规模').not.match(/<h[1-6]\b/);
  });

  it('允许零间距，保留作者属性，style 最后覆盖且不泄漏组件属性', () => {
    const zero = renderToStaticMarkup(<Eyebrow marginBottom={0}>零间距</Eyebrow>);
    expect(zero).include('margin-bottom:0').not.match(/\smarginBottom=/i);
    const html = renderToStaticMarkup(
      <Eyebrow
        id="chapter-label"
        className="custom-label"
        data-label="chapter"
        aria-label="章节"
        marginBottom={36}
        style={{ marginBottom: 12, fontSize: 21 }}
      >
        讨论的时间线
      </Eyebrow>,
    );
    expect(html).include(styles.classes.eyebrow).include('custom-label');
    expect(html).include('id="chapter-label"').include('data-label="chapter"').include('aria-label="章节"');
    expect(html).include('margin-bottom:12px').include('font-size:21px');
    expect(html).not.match(/\smarginBottom=/i);
  });
});
