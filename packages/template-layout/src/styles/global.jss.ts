import {
  createStyles,
  setScrollbarWidth,
  mergeStyles,
  FontSerif,
  FontMono,
  FontDefault,
  FontDefaultSize,
  CustomFont,
  WhiteBg,
  Black,
  BlackLight,
} from '@blog/styles';

const global = createStyles({
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
    em: {
      fontFamily: `${CustomFont.EMLora}, ${FontDefault}`,
    },
    'html, body': {
      width: '100%',
      height: '100%',
      margin: 0,
      padding: 0,
      color: Black,
      fontFamily: FontDefault,
      fontSize: FontDefaultSize,
    },
    body: {
      display: 'flex',
      flexDirection: 'column',
      backgroundImage: `url("../assets/image/bg.svg")`,
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

export default mergeStyles(global, setScrollbarWidth(6));
