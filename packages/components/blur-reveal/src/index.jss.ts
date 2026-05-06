import { createStyles, TextPrimary, FontSizeBase, RadiusLg, DurationSlow, DurationNormal, DurationFast } from '@blog/styles/compile';
import { maxHeight } from './constant';
import {
  FogGradientLeft,
  FogGradientRight,
  OverlayGradient,
  BlurBtnBg,
  BlurBtnShadow,
  BlurBtnHoverShadow,
  BlurBtnBorder,
} from './theme/token';

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
    transition: `opacity ${DurationSlow} ease`,
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
      max-height ${DurationSlow} cubic-bezier(0.25, 1, 0.5, 1),
      filter ${DurationSlow} ease,
      opacity ${DurationSlow} ease
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
    transition: `opacity ${DurationNormal} ease`,

    '&:hover $blurRevealOverlayBtn': {
      boxShadow: BlurBtnHoverShadow,
    },
  },
  blurRevealOverlayBtn: {
    background: BlurBtnBg,
    backdropFilter: 'blur(8px)',
    border: BlurBtnBorder,
    padding: [10, 24],
    borderRadius: RadiusLg,
    fontSize: FontSizeBase + 2,
    fontWeight: 600,
    color: TextPrimary,
    boxShadow: BlurBtnShadow,
    transition: `all ${DurationFast} ease`,
    cursor: 'pointer',
  },
});
