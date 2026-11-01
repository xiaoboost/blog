import { createStyles } from '@blog/styles/compile';

export default createStyles({
  box: {
    boxSizing: 'border-box',
    display: 'block',
    flex: '0 1 auto',
  },
  flex: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    flexWrap: 'nowrap',
    gap: 24,
  },
  grid: {
    display: 'grid',
    width: '100%',
    height: '100%',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    alignItems: 'stretch',
    justifyItems: 'stretch',
    gap: 24,
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
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
    objectFit: 'cover',
    objectPosition: 'center',
  },
  backgroundOverlay: {
    position: 'absolute',
    inset: 0,
  },
});
