import {
  createStyles,
  BgSecondary,
  BorderPrimary,
  TextPrimary,
} from '@blog/styles/compile';

export default createStyles({
  presentation: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:fullscreen': {
      background: BgSecondary,
      '& $card': {
        width: 'min(100vw, calc(100dvh * 16 / 9))',
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
    aspectRatio: '16 / 9',
    overflow: 'clip',
    borderRadius: 6,
    background: BgSecondary,
    color: TextPrimary,
    boxShadow: `0 0 0 1px ${BorderPrimary}, 0 8px 32px rgba(0,0,0,.04)`,
    outlineOffset: -3,
    '&:focus:not(:focus-visible)': { outline: 'none' },
  },
  canvas: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 1920,
    height: 1080,
    transformOrigin: 'top left',
    visibility: 'hidden',
    '& [data-slide-section]': { display: 'none' },
    '& [data-slide-section]:not([hidden]):first-of-type': { display: 'block' },
  },
});
