import { describe, expect, it } from '@blog/test-toolkit';
import { renderToStaticMarkup } from 'react-dom/server';
import styles from '../layout/index.jss';
import { PageLayout } from '../layout/page-layout';

describe('PageLayout 的作者约定', () => {
  it('公共留白来自 CSS，保留子内容而不创建新的幻灯片', () => {
    const html = renderToStaticMarkup(<PageLayout><p>正文</p></PageLayout>);
    expect(html).include(styles.classes.pageLayout).include('<p>正文</p>');
    expect(html).not.include('padding:').not.include('data-slide-section').not.include('<section');
  });

  it('支持零留白、单方向覆盖，style 最后覆盖且属性不泄漏', () => {
    expect(renderToStaticMarkup(<PageLayout padding={0} />)).include('padding:0');
    const html = renderToStaticMarkup(
      <PageLayout
        id="page-content"
        className="custom-page"
        data-example="layout"
        aria-label="正文"
        padding={{ horizontal: 120 }}
        style={{ paddingLeft: 80 }}
      />,
    );
    expect(html).include('id="page-content"').include('custom-page').include('data-example="layout"').include('aria-label="正文"');
    expect(html).include('padding-left:80px').include('padding-right:120px');
    expect(html).not.include('padding-top:').not.include('padding-bottom:').not.match(/\spadding=/);
  });
});
