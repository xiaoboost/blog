import { createStyles } from '@blog/styles';

export default createStyles({
  '@import': '\'katex/dist/katex.css\'',
  '@global': {
    'span.katex-mathml': {
      display: 'none',
    },
  },
  mathBlock: {
    margin: '1em 0',
    position: 'relative',
  },
  mathInline: {
    margin: '0 0.2em',
  },
});
