import { createStyles, White, Black, Shadow, FontDefaultSize } from '@blog/styles';
import { duration, maxHeight } from './constant';

const WhiteStr = White.toString();
const WhiteAlpha0 = White.alpha(0).toString();

export default createStyles({
  blurRevealExpanded: {},
  blurReveal: {
    position: 'relative',
    margin: 0,
    width: '100%',
    overflow: 'hidden',
    transform: 'translateZ(0)',

    '&$blurRevealExpanded': {
      '& $blurRevealContent': {
        filter: 'blur(0)',
        opacity: 1,
        userSelect: 'text',
      },
      '& $blurRevealFog, & $blurRevealOverlay': {
        display: 'none !important',
        pointerEvents: 'none',
      },
    },
  },
  blurRevealFog: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    zIndex: 5,
    pointerEvents: 'none',
    transition: `opacity ${duration}s ease`,
    opacity: 1,
  },
  blurRevealFogLeft: {
    left: 0,
    background: `linear-gradient(to right, ${WhiteStr} 25%, ${WhiteAlpha0} 100%)`,
  },
  blurRevealFogRight: {
    right: 0,
    background: `linear-gradient(to left, ${WhiteStr} 25%, ${WhiteAlpha0} 100%)`,
  },
  blurRevealContent: {
    position: 'relative',
    height: 'auto',
    maxHeight,
    padding: 0,
    margin: 0,
    filter: 'blur(12px)',
    opacity: 0.6,
    userSelect: 'none',
    transition: `
      max-height ${duration}s cubic-bezier(0.25, 1, 0.5, 1),
      filter ${duration}s ease,
      opacity ${duration}s ease
    `,
  },
  blurRevealOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: `linear-gradient(
      to bottom,
      ${WhiteAlpha0} 30%,
      ${White.alpha(0.8).toString()} 70%,
      ${WhiteStr} 100%
    )`,
    transition: `opacity ${duration / 2}s ease`,

    '&:hover $blurRevealOverlayBtn': {
      boxShadow: `0 8px 24px ${Black.alpha(0.12).toString()}`,
      color: Black.toString(),
    },
  },
  blurRevealOverlayBtn: {
    background: White.alpha(0.85).toString(),
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    padding: [10, 24],
    borderRadius: 6,
    fontSize: FontDefaultSize + 2,
    fontWeight: 600,
    color: Black.toString(),
    boxShadow: `0 4px 20px ${Shadow.alpha(0.2).toString()}`,
    transition: `all ${duration / 4}s ease`,
    cursor: 'pointer',
  },
});
