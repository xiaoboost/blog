import { createStyles, TextSecondary, BgSecondary, BorderPrimary, DurationNormal } from '@blog/styles/compile';
import { GotoTopShadow } from '../../styles/theme/token';

export default createStyles({
  gotoTopBtn: {},
  gotoTop: {
    position: 'fixed',
    right: 22,
    bottom: 18,
    fontSize: '1.4em',
    borderRadius: '100%',
    lineHeight: '2em',
    opacity: 0,

    '& $gotoTopBtn': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '100%',
      width: 36,
      height: 36,
      border: 0,
      cursor: 'pointer',
      color: TextSecondary,
      backgroundColor: BgSecondary,
      transition: `background-color ${DurationNormal} ease`,
      boxShadow: GotoTopShadow,

      '&:hover': {
        backgroundColor: BorderPrimary,
      },
    },
  },
});
