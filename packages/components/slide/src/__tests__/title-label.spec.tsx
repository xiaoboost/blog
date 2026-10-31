import { describe, expect, it } from '@blog/test-toolkit';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TitleLabel } from '../title-label';
import styles from '../title-label/index.jss';

describe('TitleLabel 的作者约定', () => {
  it('作为短标签输出段落，不增加标题层级，默认保留下方间距', () => {
    const html = renderToStaticMarkup(<TitleLabel>先看规模</TitleLabel>);
    expect(html).match(/^<p\b/).include(styles.classes.titleLabel).include('margin-bottom:20px');
    expect(html).include('先看规模').not.match(/<h[1-6]\b/);
  });

  it('允许零间距，保留作者属性，style 最后覆盖且不泄漏组件属性', () => {
    const zero = renderToStaticMarkup(<TitleLabel marginBottom={0}>零间距</TitleLabel>);
    expect(zero).include('margin-bottom:0').not.match(/\smarginBottom=/i);
    const html = renderToStaticMarkup(
      <TitleLabel
        id="chapter-label"
        className="custom-label"
        data-label="chapter"
        aria-label="章节"
        marginBottom={36}
        style={{ marginBottom: 12, fontSize: 21 }}
      >
        讨论的时间线
      </TitleLabel>,
    );
    expect(html).include(styles.classes.titleLabel).include('custom-label');
    expect(html).include('id="chapter-label"').include('data-label="chapter"').include('aria-label="章节"');
    expect(html).include('margin-bottom:12px').include('font-size:21px');
    expect(html).not.match(/\smarginBottom=/i);
  });
});
