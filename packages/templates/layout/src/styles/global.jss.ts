import {
  createStyles,
  createScrollbarWidth,
  getHeadSelector,
  mergeStyles,
  createThemeStyles,
  TextPrimary,
  TextSecondary,
  BgSecondary,
  FontBody,
  FontHeading,
  FontSizeBase,
} from '@blog/styles';

import themeStyles, {
  LinkDefault,
  LinkHover,
  SelectionText,
  SelectionBg,
} from './theme';

/** body 背景图在暗色模式下关闭 */
const bodyBg = createThemeStyles({
  light: { backgroundImage: "url('../assets/images/bg.svg')" },
  dark: { backgroundImage: 'none' },
});

const global = createStyles({
  '@global': {
    '*': {
      userSelect: 'inherit',
      boxSizing: 'border-box',
    },
    [getHeadSelector()]: {
      fontFamily: FontHeading,
      position: 'relative',
    },
    'html, body': {
      width: '100%',
      height: '100%',
      margin: 0,
      padding: 0,
      color: TextPrimary,
      fontFamily: FontBody,
      fontSize: FontSizeBase,
    },
    a: {
      cursor: 'pointer',
      textDecoration: 'none',
      color: LinkDefault,
      transition: 'color .2s, background .4s',

      '&:hover, &:focus': {
        outline: 0,
        color: LinkHover,
      },
    },
    body: {
      display: 'flex',
      flexDirection: 'column',
      ...bodyBg,

      // 禁用 body 的滚动条
      overflow: '-moz-scrollbars-none',
      '&::-webkit-scrollbar': {
        width: '0 !important',
      },
    },
    '::-webkit-scrollbar': {
      width: '0 !important',
    },
    '::-webkit-scrollbar-track': {
      backgroundColor: BgSecondary,
    },
    '::-webkit-scrollbar-thumb': {
      opacity: '0.7',
      backgroundColor: TextSecondary,
      transition: 'opacity ease-in-out 200ms',

      '&:hover': {
        opacity: '1',
      },
    },
    '::selection': {
      color: SelectionText,
      backgroundColor: SelectionBg,
    },
    '::-moz-selection': {
      color: SelectionText,
      backgroundColor: SelectionBg,
    },
  },
});

export default mergeStyles(
  themeStyles,
  global,
  createStyles({
    '@global': createScrollbarWidth(6),
  }),
);
