import { createStyles, FontSerif, FontMono, WhiteBg, BlackLight } from '@blog/styles';

export default createStyles({
  '@global': {
    '*': {
      userSelect: 'inherit',
      boxSizing: 'border-box',
    },
    a: {
      textDecoration: 'none',
    },
    [Array(5).fill(0).map((_, i) => `h${i + 1}`).join(',')]: {
      fontFamily: FontSerif,
      fontWeight: 'normal',
      position: 'relative',
    },
    'code, pre': {
      fontFamily: FontMono,
    },
    '::-webkit-scrollbar': {
      backgroundColor: WhiteBg,
    },
    '::-webkit-scrollbar-track': {
      backgroundColor: WhiteBg,
    },
    '::-webkit-scrollbar-thumb': {
      opacity: '0.7',
      backgroundColor: BlackLight,
      transition: 'opacity ease-in-out 200ms',

      '&:hover': {
        opacity: '1',
      },
    },
  },
});
