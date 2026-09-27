import { expect, describe, it } from '@blog/test-toolkit';
import { getLangLabel } from '../utils';

describe('getLangLabel', () => {
  it('keeps the JSX and TSX display names', () => {
    expect(getLangLabel('jsx')).to.equal('JavaScript React');
    expect(getLangLabel('tsx')).to.equal('TypeScript React');
  });

  it('uses registered language names when the local map has no entry', () => {
    expect(getLangLabel('css')).to.equal('CSS');
    expect(getLangLabel('diff')).to.equal('Diff');
    expect(getLangLabel('markdown')).to.equal('Markdown');
    expect(getLangLabel('django')).to.equal('Django');
  });

  it('resolves aliases and ignores case and surrounding whitespace', () => {
    expect(getLangLabel(' sh ')).to.equal('Bash');
    expect(getLangLabel('CSS')).to.equal('CSS');
  });

  it('preserves an unregistered name instead of hiding it', () => {
    expect(getLangLabel('My DSL')).to.equal('My DSL');
  });
});
