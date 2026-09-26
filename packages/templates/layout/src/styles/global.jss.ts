import {
  createStyles,
  createScrollbarWidth,
  getHeadSelector,
  mergeStyles,
  createThemeStyles,
  Gray,
  TextPrimary,
  TextSecondary,
  BgPrimary,
  BgSecondary,
  FontBody,
  FontHeading,
  FontSizeRegular,
  DurationFast,
  DurationNormal,
} from '@blog/styles/compile';

import {
  LinkDefault,
  LinkHover,
  SelectionText,
  SelectionBg,
} from './theme/token';

// 保留原纹理的 1px 斜线和 10px 横向间距；渐变周期沿垂直于斜线的方向计算。
const bodyPattern = `repeating-linear-gradient(
  135deg,
  ${Gray[100].alpha(0.5)} 0 1px,
  transparent 1px ${10 / Math.SQRT2}px
)`;

/** body 背景图在暗色模式下关闭 */
const bodyBg = createThemeStyles({
  light: {
    backgroundColor: 'transparent',
    backgroundImage: bodyPattern,
  },
  dark: {
    backgroundColor: BgPrimary,
    backgroundImage: 'none',
  },
});

const global = createStyles({
  '@global': {
    ':root': {
      colorScheme: 'light dark',
      '&[data-theme="light"]': {
        colorScheme: 'light',
      },
      '&[data-theme="dark"]': {
        colorScheme: 'dark',
      },
    },
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
      fontSize: FontSizeRegular,
    },
    a: {
      cursor: 'pointer',
      textDecoration: 'none',
      color: LinkDefault,
      transition: `color ${DurationFast}, background ${DurationNormal}`,

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
      transition: `opacity ease-in-out ${DurationFast}`,

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
  global,
  createStyles({
    '@global': createScrollbarWidth(6),
  }),
);
