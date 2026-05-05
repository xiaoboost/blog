import {
  createStyles,
  TextPrimary,
  BgSecondary,
  BorderPrimary,
  ShadowCard,
  TextTertiary,
  FontBody,
  FontHeading,
} from '@blog/styles';
import { ListItemTitleFontFamily } from '../../constant/font';

export const PostTitleStyle = {
  color: TextPrimary,
  textShadow: '0.05px 0 0 currentColor',
  fontFamily: `${ListItemTitleFontFamily}, ${FontHeading}`,
};

export const PostSubTitleStyle = {
  color: TextTertiary,
  fontSize: 12,
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
    borderRadius: '4px',
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
        fontSize: 19,
        lineHeight: 1.35,
      },
      '& time': {
        ...PostSubTitleStyle,
        fontSize: 13,
      },
    },
    '& $postsListItemDescription': {
      fontSize: 14,
      marginTop: 12,
    },
    '& $postsListItemFooter': {
      fontSize: 12,
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
