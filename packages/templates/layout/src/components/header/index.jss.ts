import {
  createStyles,
  TextPrimary,
  TextSecondary,
  TextTertiary,
  BgPrimary,
  FontHeading,
  WidthMain,
} from '@blog/styles';
import { ShadowHeader } from '../../styles/theme';
import { SiteTitleFontFamily } from '../../constant/font';

export default createStyles({
  mainTitle: {},
  mainNavItemHighlight: {},
  mainHeaderWrapper: {
    width: '100%',
    height: 42,
    backgroundColor: BgPrimary,
    boxShadow: ShadowHeader,
    flex: '0 0 auto',
    display: 'flex',
    justifyContent: 'center',
  },
  mainHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: WidthMain,
    padding: [0, 10],

    '& $mainTitle': {
      display: 'flex',
      fontSize: 24,
      color: TextPrimary,
      alignItems: 'center',
      fontFamily: `${SiteTitleFontFamily}, ${FontHeading}`,
    },
  },
  mainNav: {
    display: 'flex',
    alignItems: 'center',
    height: '100%',
  },
  mainNavItem: {
    marginLeft: 20,
    color: TextTertiary,
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    height: '100%',
    transition: 'color .2s',

    '&$mainNavItemHighlight': {
      color: TextPrimary,
    },

    '&:hover': {
      color: TextSecondary,
    },
  },
  mainNavItemBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    width: '100%',
    background: TextPrimary,
  },
});
