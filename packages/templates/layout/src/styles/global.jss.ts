import {
  createStyles,
  createScrollbarWidth,
  getHeadSelector,
  Color,
  mergeStyles,
  FontSerif,
  FontDefault,
  FontDefaultSize,
  WhiteBg,
  Black,
  BlackLight,
  SelectedColor,
  SelectedBgColor,
} from '@blog/styles';

const linkColor = Color.rgb(23, 81, 153).alpha(0.6);
const linkHoverColor = Color.rgb(23, 81, 153);

const global = createStyles({
  '@global': {
    '*': {
      userSelect: 'inherit',
      boxSizing: 'border-box',
    },
    [getHeadSelector()]: {
      fontFamily: FontSerif,
      position: 'relative',
    },
    'html, body': {
      width: '100%',
      height: '100%',
      margin: 0,
      padding: 0,
      color: Black.toString(),
      fontFamily: FontDefault,
      fontSize: FontDefaultSize,
    },
    a: {
      cursor: 'pointer',
      textDecoration: 'none',
      color: linkColor.toString(),
      transition: 'color .2s, background .4s',

      '&:hover, &:focus': {
        outline: 0,
        color: linkHoverColor.toString(),
      },
    },
    body: {
      display: 'flex',
      flexDirection: 'column',
      backgroundImage: `url("../assets/images/bg.svg")`,

      // 禁用 body 的滚动条
      overflow: '-moz-scrollbars-none',
      '&::-webkit-scrollbar': {
        width: '0 !important',
      },
    },
    '::-webkit-scrollbar': {
      width: '0 !important',
      // backgroundColor: WhiteBg.toString(),
    },
    '::-webkit-scrollbar-track': {
      backgroundColor: WhiteBg.toString(),
    },
    '::-webkit-scrollbar-thumb': {
      opacity: '0.7',
      backgroundColor: BlackLight.toString(),
      transition: 'opacity ease-in-out 200ms',

      '&:hover': {
        opacity: '1',
      },
    },
    '::selection': {
      color: SelectedColor.toString(),
      backgroundColor: SelectedBgColor.toString(),
    },
    '::-moz-selection': {
      color: SelectedColor.toString(),
      backgroundColor: SelectedBgColor.toString(),
    },
  },
});

export default mergeStyles(
  global,
  createStyles({
    '@global': createScrollbarWidth(6),
  }),
);
