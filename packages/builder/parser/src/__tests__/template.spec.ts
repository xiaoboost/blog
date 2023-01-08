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
});
