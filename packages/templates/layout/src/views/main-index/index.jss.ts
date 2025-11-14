import {
  createStyles,
  Black,
  White,
  Gray,
  MainShadow,
  BlackLighter,
  FontDefault,
  FontSerif,
} from '@blog/styles';

export const PostTitleStyle = {
  color: Black.toString(),
  lineHeight: 1,
  fontWeight: 600,
  fontFamily: FontSerif,
};

export const PostSubTitleStyle = {
  color: BlackLighter.toString(),
  fontSize: 12,
  fontWeight: 'normal',
  fontFamily: FontDefault,
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
    color: Black.toString(),
    backgroundColor: White.toString(),
    width: '100%',
    borderRadius: '4px',
    overflow: 'hidden',
    boxShadow: MainShadow,

    '& $postsListItem': {
      margin: 0,
      padding: '20px 24px',
      boxShadow: 'none',
      boxSizing: 'border-box',
      backgroundColor: White.toString(),
      borderBottom: `1px solid ${Gray.toString()}`,
      fontFamily: FontDefault,
      fontWeight: 'normal',
      color: Black.toString(),

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
        fontSize: 18,
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
        color: BlackLighter.toString(),
      },
      '& $postsListItemFooterTagSplit': {
        color: BlackLighter.toString(),
        cursor: 'default',
      },
      '& $postsListItemFooterTag': {
        margin: 0,
        color: BlackLighter.toString(),

        '&:hover': {
          color: Black.toString(),
        },
      },
    },
  },
});
