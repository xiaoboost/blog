import { createStyles, BorderPrimary, TextSecondary } from '@blog/styles/compile';

export default createStyles({
  loading: {
    position: 'absolute',
    inset: 0,
    display: 'grid',
    placeItems: 'center',
    visibility: 'hidden',
    pointerEvents: 'none',
  },
  spinner: {
    width: 22,
    height: 22,
    border: `2px solid ${BorderPrimary}`,
    borderTopColor: TextSecondary,
    borderRadius: '50%',
    animation: '$spin 900ms linear infinite',
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  },
  '@keyframes spin': {
    to: {
      transform: 'rotate(360deg)',
    },
  },
});
