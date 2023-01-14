import {
  createStyles,
  Black,
  White,
  Shadow,
  BlackLight,
  Gray,
  GrayLight,
  BlueLight,
  mediaPhone,
  mainWidth,
  articleWidth,
  asideMarginLeft,
} from '@blog/styles';

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
      listStyle: 'none',

      '& $menuList': {
        paddingLeft: 14,
        marginBottom: 4,
        marginLeft: 3,
        borderLeft: `1px solid ${Gray.toString()}`,
        transition: 'border-color .1s linear',

        '&$menuListHighlight': {
          borderColor: BlackLight.toString(),
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
      color: BlueLight.toString(),
    },

    '& a': {
      transition: `color .1s linear`,
      color: Black.toString(),
      textDecoration: 'none',
      display: 'flex',
      alignItems: 'center',
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
