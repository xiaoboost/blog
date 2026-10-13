import { createStyles, BgSecondary, TextPrimary } from '@blog/styles/compile';

export default createStyles({
  slide: {
    color: TextPrimary,
    background: BgSecondary,
  },
  section: {
    position: 'relative',
    isolation: 'isolate',
    overflow: 'hidden',
    boxSizing: 'border-box',
    width: 1920,
    height: 1080,
  },
});
