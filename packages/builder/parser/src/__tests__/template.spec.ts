import { expect, describe, it } from '@blog/test-toolkit';
import { encodeImageTemplate, decodeTemplate } from '../template';

describe('encodeTemplate', () => {
  it('encodeImageTemplate', async () => {
    expect(encodeImageTemplate('img0')).eq('`${img0}`');
    expect(encodeImageTemplate('img')).eq('`${img}`');
  });

  it('decodeTemplate', async () => {
    expect(decodeTemplate(`<Img src='%60$%7Bimg0%7D%60' />`)).eq('<Img src={`${img0}`} />');
    expect(decodeTemplate(`<Img src='%60$%7Bimg%7D%60' />`)).eq('<Img src={`${img}`} />');
  });

  it('解码带着 alt 属性的图片', async () => {
    expect(decodeTemplate(`<Img src='%60$%7Bimg0%7D%60' alt='test' />`)).eq(
      "<Img src={`${img0}`} alt='test' />",
    );
    expect(decodeTemplate(`<Img src='%60$%7Bimg%7D%60' alt='test' />`)).eq(
      "<Img src={`${img}`} alt='test' />",
    );
  });

  it('解码多张图片', async () => {
    expect(
      decodeTemplate(
        `<Img src='%60$%7Bimg0%7D%60' alt='test' />
        <Img src='%60$%7Bimg1%7D%60' alt='test' />
        <Img src='%60$%7Bimg2%7D%60' alt='test' />`,
      ),
    ).eq(
      `<Img src={\`\${img0}\`} alt='test' />
        <Img src={\`\${img1}\`} alt='test' />
        <Img src={\`\${img2}\`} alt='test' />`,
    );
  });
});
