import {
  createStyles,
  Black,
  White,
  Shadow,
  GrayLight,
  BlueLight,
  mediaPhone,
  mainWidth,
  articleWidth,
  asideMarginLeft,
} from '@blog/shared/styles';

export default createStyles({
  menuListHeader: {},
  menuList: {},
  menuListArticle: {},
  menuItem: {},
  menuItemHighlight: {},
  menuLevel1: {},
  menuLevel2: {},
  toContent: {
    [mediaPhone]: {
      display: 'none',
    },

    color: Black.toString(),
    backgroundColor: White.toString(),
    boxShadow: `0 1px 3px ${Shadow.toString()}`,
    position: 'absolute',
    width: mainWidth - articleWidth - asideMarginLeft,
    marginLeft: articleWidth + asideMarginLeft,
    boxSizing: 'border-box',
    padding: `0 14px`,
    fontSize: 14,
    flexGrow: 0,
    flexShrink: 0,

    '& $menuListHeader': {
      padding: '8px 0',
      borderBottom: `1px solid ${GrayLight.toString()}`,
    },

    '& $menuList': {
      padding: 0,

      '& $menuList': {
        paddingLeft: 16,
        marginBottom: 8,
      },
    },

    '& $menuListArticle': {
      marginLeft: 16,
    },

    '& $menuItem': {
      marginTop: 4,

      '& $menuLevel1': {
        marginTop: 0,
      },
    },

    '& $menuItemHighlight > a': {
      color: BlueLight.toString(),
    },

    '& a': {
      transition: `color .1s linear`,
      color: Black.toString(),
      textDecoration: 'none',
    },
    '& code': {
      margin: '0 0.2em',
      padding: '0.1em',
      fontSize: '0.85em',
      borderRadius: 4,
      backgroundColor: '#fef9ed',

      '&:first-child': {
        marginLeft: '-0.2em',
      },
    },
  },
});
