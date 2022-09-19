import { expect } from '@blog/test-toolkit';
import { getMinSpaceWidth } from '../utils';

describe('getMinSpaceWidth', () => {
  it('default space', () => {
    const code = `
const abc = '123';
const abc = '123';
const abc = '123';
    `;

    expect(getMinSpaceWidth(code)).to.eq(2);
  });
  it('two space', () => {
    const code = `
if (true) {
  const abc = '123';

  if (true) {
    const abc2 = '123';
  }
}
    `;

    expect(getMinSpaceWidth(code)).to.eq(2);
  });
  it('four space', () => {
    const code = `
if (true) {
    const abc = '123';

    if (true) {
        const abc2 = '123';
    }
}
    `;

    expect(getMinSpaceWidth(code)).to.eq(4);
  });
  it('have tow mode space, select the small one', () => {
    const code = `
if (true) {
    const abc = '123';

  if (true) {
      const abc2 = '123';
  }
}
    `;

    expect(getMinSpaceWidth(code)).to.eq(2);
  });
});
