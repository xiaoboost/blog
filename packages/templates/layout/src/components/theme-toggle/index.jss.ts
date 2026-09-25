import {
  AccentPrimary,
  createStyles,
  DurationFast,
  FontSizeMd,
  RadiusMd,
  TextSecondary,
  TextTertiary,
} from '@blog/styles/compile';

export default createStyles({
  autoIcon: {},
  lightIcon: {},
  darkIcon: {},
  toggle: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: '0 0 auto',
    width: 36,
    height: 36,
    padding: 0,
    marginLeft: 16,
    border: 0,
    borderRadius: RadiusMd,
    background: 'transparent',
    color: TextTertiary,
    fontSize: FontSizeMd,
    cursor: 'pointer',
    transition: `color ${DurationFast}`,

    '& > i': {
      transform: 'translateY(2px)',
    },

    '& $lightIcon, & $darkIcon': {
      display: 'none',
    },
    ':root[data-theme="light"] & $autoIcon, :root[data-theme="dark"] & $autoIcon': {
      display: 'none',
    },
    ':root[data-theme="light"] & $lightIcon, :root[data-theme="dark"] & $darkIcon': {
      display: 'inline-block',
    },

    '&:hover': {
      color: TextSecondary,
    },
    '&:focus-visible': {
      outline: `2px solid ${AccentPrimary}`,
      outlineOffset: 1,
    },
    '&:disabled': {
      cursor: 'default',
    },
    '@media (max-width: 480px)': {
      width: 32,
      marginLeft: 8,
    },
  },
});
