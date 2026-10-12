import { createStyles, BgSecondary, TextPrimary } from '@blog/styles/compile';

export default createStyles({
  slide: {
    color: TextPrimary,
    background: BgSecondary,
    cursor: 'default !important',
  },
  section: {
    position: 'relative',
    isolation: 'isolate',
    overflow: 'hidden',
    boxSizing: 'border-box',
    width: 2560,
    height: 1440,
  },
});
