import {
  createStyles,
  TextPrimary,
  TextSecondary,
  BgSecondary,
  BorderPrimary,
  RadiusMd,
  DurationInstant,
  createMediaStyles,
} from '@blog/styles/compile';
import { AccentLight, BgCode, BgTertiary, TocShadow } from '../theme/token';
import { tocMarginLeft, tocWidth } from './constant';

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
  toContent: {
    ...createMediaStyles({
      phone: { display: 'none' },
    }),

    color: TextPrimary,
    backgroundColor: BgSecondary,
    boxShadow: TocShadow,
    position: 'absolute',
    width: 200,
    right: 0 - tocWidth - tocMarginLeft,
    boxSizing: 'border-box',
    padding: '0 14px',
    fontSize: 14,
    flexGrow: 0,
    flexShrink: 0,

    '& $menuListHeader': {
      padding: '8px 0',
      borderBottom: `1px solid ${BgTertiary}`,
    },

    '& $menuList': {
      padding: 0,
      listStyle: 'none',

      '& $menuList': {
        paddingLeft: 14,
        marginBottom: 4,
        marginLeft: 3,
        borderLeft: `1px solid ${BorderPrimary}`,
        transition: `border-color ${DurationInstant} linear`,

        '&$menuListHighlight': {
          borderColor: TextSecondary,
        },
      },
    },

    '& $menuIcon': {
      marginRight: 3,
      fontSize: 6,
    },

    '& $menuItem': {
      marginTop: 4,

      '&$menuLevel1': {
        fontSize: 14,
      },

      '&$menuLevel2': {
        fontSize: 12,
      },
    },

    '& $menuItemHighlight > a': {
      color: AccentLight,
    },

    '& a': {
      transition: `color ${DurationInstant} linear`,
      color: TextPrimary,
      textDecoration: 'none',
      display: 'flex',
      alignItems: 'center',
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
