import { createStyles } from '@blog/styles/compile';

export default createStyles({
  box: {
    boxSizing: 'border-box',
    display: 'block',
  },
  flex: {
    display: 'flex',
    gap: 24,
  },
  grid: {
    display: 'grid',
    width: '100%',
    height: '100%',
    gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
    gap: 24,
  },
  center: {
    display: 'flex',
    width: '100%',
    height: '100%',
  },
  place: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  background: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: -1,
  },
  backgroundImage: {
    display: 'block',
    width: '100%',
    height: '100%',
    objectPosition: 'center',
  },
  backgroundOverlay: {
    position: 'absolute',
    inset: 0,
  },
});
