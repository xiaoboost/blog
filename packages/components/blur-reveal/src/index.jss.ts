import { createStyles, TextPrimary, FontSizeBase } from '@blog/styles';
import { duration, maxHeight } from './constant';
import {
  FogGradientLeft,
  FogGradientRight,
  OverlayGradient,
  BlurBtnBg,
  BlurBtnShadow,
  BlurBtnHoverShadow,
  BlurBtnBorder,
} from './theme';

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
        opacity: 0,
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
    background: FogGradientLeft,
  },
  blurRevealFogRight: {
    right: 0,
    background: FogGradientRight,
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
    background: OverlayGradient,
    transition: `opacity ${duration / 2}s ease`,

    '&:hover $blurRevealOverlayBtn': {
      boxShadow: BlurBtnHoverShadow,
    },
  },
  blurRevealOverlayBtn: {
    background: BlurBtnBg,
    backdropFilter: 'blur(8px)',
    border: BlurBtnBorder,
    padding: [10, 24],
    borderRadius: 6,
    fontSize: FontSizeBase + 2,
    fontWeight: 600,
    color: TextPrimary,
    boxShadow: BlurBtnShadow,
    transition: `all ${duration / 4}s ease`,
    cursor: 'pointer',
  },
});
