import { mainWidth } from '@blog/styles/common';
import {
  createStyles,
  TextSecondary,
  TextTertiary,
  BgSecondary,
  BorderPrimary,
  RadiusMd,
  DurationInstant,
  FontSizeRegular,
  FontSizeSm,
} from '@blog/styles/compile';
import { AccentLight, BgCode, TocShadow } from '../theme/token';
import { tocMarginLeft, tocWidth } from './constant';

const tocBorder = `color-mix(in srgb, ${BorderPrimary} 65%, ${BgSecondary})`;
// 正文保持居中，右侧余白需容纳目录、正文间隔和 12px 的屏幕边距。
const tocMinViewportWidth = mainWidth + 2 * (tocWidth + tocMarginLeft + 12);

export default createStyles({
  menuListHeader: {},
  menuList: {},
  menuListArticle: {},
  menuItem: {},
  menuItemHighlight: {},
  menuListHighlight: {},
  menuLevel1: {},
  menuLevel2: {},
  menuIcon: {},
  menuTitle: {},
  toContent: {
    [`@media (max-width: ${tocMinViewportWidth - 1}px)`]: { display: 'none' },

    color: TextSecondary,
    backgroundColor: BgSecondary,
    boxShadow: TocShadow,
    position: 'absolute',
    width: tocWidth,
    right: 0 - tocWidth - tocMarginLeft,
    boxSizing: 'border-box',
    padding: '0 14px',
    fontSize: FontSizeRegular,
    lineHeight: 1.45,
    flexGrow: 0,
    flexShrink: 0,

    '& $menuListHeader': {
      padding: '8px 0',
      fontSize: FontSizeRegular,
      color: TextTertiary,
      borderBottom: `1px solid ${tocBorder}`,
    },

    '& $menuListArticle > $menuList': {
      marginTop: 12,
      '& > $menuItem + $menuItem': {
        marginTop: 12,
      },
    },

    '& $menuList': {
      padding: 0,
      listStyle: 'none',

      '& $menuList': {
        paddingLeft: 11,
        marginTop: 6,
        marginBottom: 0,
        marginLeft: 3,
        borderLeft: `1px solid ${tocBorder}`,
        transition: `border-color ${DurationInstant} linear`,

        '&$menuListHighlight': {
          borderColor: `color-mix(in srgb, ${TextTertiary} 30%, ${BgSecondary})`,
        },
        '& $menuItem': {
          marginTop: 6,
        },
      },
    },

    '& $menuIcon': {
      flex: '0 0 6px',
      marginTop: `calc((${FontSizeRegular} * 1.45 - 6px) / 2)`,
      marginRight: 3,
      fontSize: 6,
      color: TextTertiary,
    },

    '& $menuTitle': {
      minWidth: 0,
      flex: 1,
      textWrap: 'balance',
    },

    '& $menuItem': {
      marginTop: 4,

      '&$menuLevel1': {
        fontSize: FontSizeRegular,
      },

      '&$menuLevel2': {
        fontSize: FontSizeSm,
      },
    },

    '& $menuItemHighlight > a': {
      color: AccentLight,
      '& $menuIcon': {
        color: 'inherit',
      },
    },

    '& a': {
      transition: `color ${DurationInstant} linear`,
      color: TextSecondary,
      textDecoration: 'none',
      display: 'flex',
      alignItems: 'flex-start',
      '&:hover': {
        color: AccentLight,
        '& $menuIcon': {
          color: 'inherit',
        },
      },
    },
    '& code': {
      margin: '0 0.2em',
      padding: '0.1em',
      fontSize: '0.85em',
      borderRadius: RadiusMd,
      backgroundColor: BgCode,

      '&:first-child': {
        marginLeft: '-0.2em',
      },
    },
  },
});
