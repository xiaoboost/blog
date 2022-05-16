import { createStyles } from '@blog/shared/styles';
import { width } from './constant';

export default createStyles({
  invisible: {
    opacity: 0,
    pointerEvents: 'none',
    transition: 'opacity .8s linear',
  },
  visible: {
    opacity: 1,
    transition: 'opacity .2s linear',
  },
  scrollbar: {
    position: 'fixed',
    background: 'transparent',
    height: '100%',
    top: 0,
    right: 0,
    width,
  },
  slider: {
    position: 'absolute',
    left: 0,
    width,
    transform: 'translate3d(0px, 0px, 0px)',
    contain: 'strict',
    background: 'rgba(100, 100, 100, 0.4)',

    '&:hover': {
      background: 'rgba(100, 100, 100, 0.6)',
    },
  },
});
