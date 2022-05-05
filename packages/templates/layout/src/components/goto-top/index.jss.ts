import { createStyles, BlackLight, WhiteBg, Gray } from '@blog/shared/styles';
import { fadeTime } from './constant';

export default createStyles({
  gotoTopBtn: {},
  gotoTop: {
    position: 'fixed',
    right: 18,
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
      color: BlackLight.toString(),
      backgroundColor: WhiteBg.toString(),
      transition: `background-color ${fadeTime}ms ease`,
      boxShadow: `0 0px 5px ${BlackLight.toString()}`,

      '&:hover': {
        backgroundColor: Gray.toString(),
      },
    },
  },
});
