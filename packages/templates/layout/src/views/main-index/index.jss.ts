import {
  createStyles,
  TextPrimary,
  BgSecondary,
  BorderPrimary,
  RadiusMd,
  ShadowCard,
  TextTertiary,
  FontBody,
  FontHeading,
  FontSizeSm,
  FontSizeRegular,
  FontSizeLg,
} from '@blog/styles/compile';
import { ListItemTitleFontFamily } from '../../constant/font';

export const PostTitleStyle = {
  color: TextPrimary,
  textShadow: '0.05px 0 0 currentColor',
  fontFamily: `${ListItemTitleFontFamily}, ${FontHeading}`,
};

export const PostSubTitleStyle = {
  color: TextTertiary,
  fontSize: FontSizeSm,
  fontWeight: 'normal',
  fontFamily: FontBody,
};

export default createStyles({
  postsListItemFooter: {},
  postsListItemDescription: {},
  postsListItemHeader: {},
  postsListItem: {},
  postsListItemFooterIcon: {},
  postsListItemFooterTag: {},
  postsListItemFooterTagSplit: {},
  postsList: {
    color: TextPrimary,
    backgroundColor: BgSecondary,
    width: '100%',
    borderRadius: RadiusMd,
    overflow: 'hidden',
    boxShadow: ShadowCard,

    '& $postsListItem': {
      margin: 0,
      padding: '20px 24px',
      boxShadow: 'none',
      boxSizing: 'border-box',
      borderBottom: `1px solid ${BorderPrimary}`,
      fontFamily: FontBody,
      fontWeight: 'normal',
      color: TextPrimary,

      '&:last-child': {
        borderBottom: 'none',
      },
    },
    '& $postsListItemHeader': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',

      '& a': {
        ...PostTitleStyle,
        fontSize: `calc(${FontSizeLg} - 1px)`,
        lineHeight: 1.35,
      },
      '& time': {
        ...PostSubTitleStyle,
        fontSize: `calc(${FontSizeRegular} - 1px)`,
      },
    },
    '& $postsListItemDescription': {
      fontSize: FontSizeRegular,
      marginTop: 12,
    },
    '& $postsListItemFooter': {
      fontSize: FontSizeSm,
      marginTop: 12,
      display: 'flex',

      '& $postsListItemFooterIcon': {
        marginRight: 4,
        color: TextTertiary,
      },
      '& $postsListItemFooterTagSplit': {
        color: TextTertiary,
        cursor: 'default',
      },
      '& $postsListItemFooterTag': {
        margin: 0,
        color: TextTertiary,

        '&:hover': {
          color: TextPrimary,
        },
      },
    },
  },
});
