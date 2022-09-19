import { expect } from '@blog/test-toolkit';
import { addSplitLabel } from '../utils';

describe('addSplitLabel', () => {
  it('one line have label by space', () => {
    const code = `    console.log('hello');`;
    expect(addSplitLabel(code, 2, '|').join('\n')).to.eq(`|  |  console.log('hello');`);
  });
  it('code block', () => {
    const code = `
if (true) {
  console.log('Hello');
}
    `.trim();

    expect(addSplitLabel(code, 2, '|').join('\n')).to.eq(
      `
if (true) {
|  console.log('Hello');
}
    `.trim(),
    );
  });
  it('code block with space line', () => {
    const code = `
if (true) {
  console.log('Hello');

}
    `.trim();

    expect(addSplitLabel(code, 2, '|').join('\n')).to.eq(
      `
if (true) {
|  console.log('Hello');
|
}
    `.trim(),
    );
  });
  it('code block with nesting', () => {
    const code = `
if (true) {
  console.log('Hello');

  if (true) {
    console.log('Hello');

  }

}
    `.trim();

    expect(addSplitLabel(code, 2, '|').join('\n')).to.eq(
      `
if (true) {
|  console.log('Hello');
|
|  if (true) {
|  |  console.log('Hello');
|  |
|  }
|
}
    `.trim(),
    );
  });
  it('call func next line', () => {
    const code = `
new WebSocket('test', 'test')
  .addEventListener('message', (event: MessageEvent<string>) => {
    const updates = JSON.parse(event.data);

    for (const data of updates) {
      // ..
    }
    
  const abc = '123';
});
    `.trim();

    expect(addSplitLabel(code, 2, '|').join('\n')).to.eq(
      `
new WebSocket('test', 'test')
|  .addEventListener('message', (event: MessageEvent<string>) => {
|  |  const updates = JSON.parse(event.data);
|  |
|  |  for (const data of updates) {
|  |  |  // ..
|  |  }
|  |
|  const abc = '123';
});
    `.trim(),
    );
  });
  it('comment block', () => {
    const code = `
/**
 * 注释块
 */
      `.trim();

    expect(addSplitLabel(code, 2, '|').join('\n')).to.eq(
      `
/**
| * 注释块
| */
      `.trim(),
    );
  });
  it('comment block with code block', () => {
    const code = `
function abc() {
  /**
   * 注释块
   */
  const abc = '123';
}
        `.trim();

    expect(addSplitLabel(code, 2, '|').join('\n')).to.eq(
      `
function abc() {
|  /**
|  | * 注释块
|  | */
|  const abc = '123';
}
        `.trim(),
    );
  });
});
