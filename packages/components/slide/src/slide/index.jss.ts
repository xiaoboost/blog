import { createStyles, BgSecondary, TextPrimary } from '@blog/styles/compile';
import { SlideWidth, SlideHeight } from '../shared';

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
    width: SlideWidth,
    height: SlideHeight,
  },
});
