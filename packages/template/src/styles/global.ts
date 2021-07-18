import { createStyles, FontMono, WhiteBg, BlackLight } from '@blog/styles';

export const globalStyles = createStyles({
  '@global': {
    '*': {
      userSelect: 'inherit',
      boxSizing: 'border-box',
    },
    a: {
      textDecoration: 'none',
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
