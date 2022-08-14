import { expect } from '@blog/tests';
import { getHighlightCode } from '../utils';

describe('getHighlightCode', () => {
  it('basic', () => {
    const code = `
    const abc = '123';
    const abc = '123'; /***  hl  ***/
    const abc = '123';
    `.trim();

    const result = getHighlightCode(code);
    expect(result.highlightLines).deep.eq({ 1: true });
  });
  it('two lines', () => {
    const code = `
    const abc = '123';
    const abc = '123'; /***  hl ***/
    const abc = '123'; /*** hl          ***/
    `.trim();

    const result = getHighlightCode(code);
    expect(result.highlightLines).deep.eq({ 1: true, 2: true });
  });
  it('must have space', () => {
    const code = `
    const abc = '123';
    const abc = '123'; /***hl ***/
    const abc = '123';
    `.trim();

    const result = getHighlightCode(code);
    expect(result.highlightLines).deep.eq({});
  });
});
