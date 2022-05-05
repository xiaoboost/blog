import {
  createStyles,
  Black,
  BlackLight,
  BlackLighter,
  White,
  mainWidth,
  FontTitle,
  FontDefault,
} from '@blog/shared/styles';

export default createStyles({
  mainTitle: {},
  mainNavItemHighlight: {},
  mainHeaderWrapper: {
    width: '100%',
    height: 40,
    backgroundColor: White.toString(),
    boxShadow: '0 1px 3px rgba(26,26,26,.1)',
    flex: '0 0 auto',
    display: 'flex',
    justifyContent: 'center',
  },
  mainHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: mainWidth,
    padding: [0, 10],

    '& $mainTitle': {
      display: 'flex',
      fontSize: 24,
      color: Black.toString(),
      alignItems: 'center',
      fontFamily: `${FontTitle}, ${FontDefault}`,
    },
  },
  mainNav: {
    display: 'flex',
    alignItems: 'center',
    height: '100%',
  },
  mainNavItem: {
    marginLeft: 20,
    color: BlackLighter.toString(),
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    height: '100%',
    transition: 'color .2s',

    '&$mainNavItemHighlight': {
      color: Black.toString(),
    },

    '&:hover': {
      color: BlackLight.toString(),
    },
  },
  mainNavItemBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    width: '100%',
    background: Black.toString(),
  },
});
