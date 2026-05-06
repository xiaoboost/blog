import { createStyles, TextTertiary, DurationNormal, DurationFast } from '@blog/styles/compile';

export default createStyles({
  invisible: {},
  visible: {},
  slider: {},
  disable: {},
  scrollbar: {
    position: 'absolute',
    background: 'transparent',
    top: 0,
    right: 0,

    '&$invisible': {
      opacity: 0,
      transition: `opacity ${DurationNormal} linear`,
    },
    '&$visible': {
      opacity: 1,
      transition: `opacity ${DurationFast} linear`,
    },
    '&$disable': {
      display: 'none',
      pointerEvents: 'none',
    },
    '& $slider': {
      position: 'absolute',
      left: 0,
      transform: 'translate3d(0px, 0px, 0px)',
      contain: 'strict',
      background: TextTertiary,
    },
  },
});
