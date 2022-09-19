import { expect } from '@blog/test-toolkit';
import { formatCode } from '../utils';

describe('formatCode', () => {
  it('basic', () => {
    const code = `
    const abc = '123';
    const abc = '123';
    const abc = '123';
    `;

    const result = formatCode(code);
    expect(result).to.eq(
      `
const abc = '123';
const abc = '123';
const abc = '123';
    `.trim(),
    );
  });
  it('have code block', () => {
    const code = `
    if (true) {
      const abc = '123';
    }
    `;

    const result = formatCode(code);
    expect(result).to.eq(
      `
if (true) {
  const abc = '123';
}
    `.trim(),
    );
  });
  it('have deep code block', () => {
    const code = `
    if (true) {
      const abc = '123';

      if (true) {
        const abc2 = '123';
      }
    }
    `;

    const result = formatCode(code);
    expect(result).to.eq(
      `
if (true) {
  const abc = '123';

  if (true) {
    const abc2 = '123';
  }
}
    `.trim(),
    );
  });
});
