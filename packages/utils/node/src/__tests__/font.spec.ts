import { Buffer } from 'buffer';
import { expect, describe, it } from '@blog/test-toolkit';
import { FontBucket } from '../font';

describe('FontBucket 字重声明', () => {
  for (const weight of [600, 700]) {
    it(`让 font-face 和完整样式中的字重保持为 ${weight}`, async () => {
      const bucket = new FontBucket({
        fontContent: Buffer.from('font-fixture'),
        fontFamily: 'heading',
        fontWeight: weight,
      });
      bucket.addText('标题');
      // 本测试验证 CSS 产出，不进行字体二进制子集化。
      await bucket.build({ format: ({ path }) => path, minify: false });

      expect(bucket.getFontFaceCss()).include(`font-weight:${weight};`);
      expect(bucket.getClassNameCss()).include(`font-weight:${weight}`);
      expect(bucket.getCss().content.toString()).include(bucket.getFontFaceCss());
    });
  }

  it('未指定字重时声明常规字体，并保留原有元素的字重继承', async () => {
    const bucket = new FontBucket({
      fontContent: Buffer.from('font-fixture'),
      fontFamily: 'custom',
    });
    bucket.addText('正文');
    await bucket.build({ format: ({ path }) => path, minify: false });

    expect(bucket.getFontFaceCss()).include('font-weight:400;');
    expect(bucket.getClassNameCss()).not.include('font-weight');
  });
});
