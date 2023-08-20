import { createStyles } from '@blog/styles';

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
      transition: 'opacity .5s linear',
    },
    '&$visible': {
      opacity: 1,
      transition: 'opacity .2s linear',
    },
    '&$disable': {
      display: 'none',
      'pointer-events': 'none',
    },
    '& $slider': {
      position: 'absolute',
      left: 0,
      transform: 'translate3d(0px, 0px, 0px)',
      contain: 'strict',
      background: 'rgba(100, 100, 100, 0.5)',
    },
  },
});
