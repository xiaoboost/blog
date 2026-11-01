import { SlideWidth, SlideHeight } from '@blog/mdx-slide/shared';
import {
  createStyles,
  BgSecondary,
  BorderPrimary,
  TextPrimary,
} from '@blog/styles/compile';

export default createStyles({
  presentation: {
    position: 'relative',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    touchAction: 'pan-y pinch-zoom',
    '&:fullscreen': {
      background: BgSecondary,
      '& $card': {
        width: `min(100vw, calc(100dvh * ${SlideWidth} / ${SlideHeight}))`,
        maxWidth: 'none',
        borderRadius: 0,
        boxShadow: 'none',
      },
    },
  },
  card: {
    position: 'relative',
    width: '100%',
    maxWidth: 1600,
    aspectRatio: `${SlideWidth} / ${SlideHeight}`,
    overflow: 'clip',
    borderRadius: 6,
    background: BgSecondary,
    color: TextPrimary,
    boxShadow: `0 0 0 1px ${BorderPrimary}, 0 8px 32px rgba(0,0,0,.04)`,
    outlineOffset: -3,
    outline: 'none',
    '&:focus:not(:focus-visible)': { outline: 'none' },
  },
  canvas: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: SlideWidth,
    height: SlideHeight,
    transformOrigin: 'top left',
    visibility: 'hidden',
    '& [data-slide-section]': {
      display: 'none',
      position: 'absolute',
      left: 0,
      top: 0,
    },
    '& [data-slide-section]:not([hidden]):first-of-type': { display: 'block' },
  },
});
