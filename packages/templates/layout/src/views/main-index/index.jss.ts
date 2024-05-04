import {
  createStyles,
  Black,
  White,
  Shadow,
  Gray,
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
  postsList: {
    color: Black.toString(),
    backgroundColor: White.toString(),
    boxShadow: `0 1px 3px ${Shadow.toString()}`,
    width: '100%',

    '& $postsListItem': {
      margin: 0,
      padding: '15px 20px',
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
        fontSize: 20,
      },
      '& time': {
        ...PostSubTitleStyle,
      },
    },
    '& $postsListItemDescription': {
      fontSize: 14,
      marginTop: 10,
    },
    '& $postsListItemFooter': {
      fontSize: 12,
      marginTop: 12,
      display: 'flex',
    },
    '& $postsListItemFooterIcon': {
      marginRight: 4,
      color: BlackLighter.toString(),
    },
    '& $postsListItemFooterTag': {
      margin: 0,
      color: BlackLighter.toString(),

      '&:hover': {
        color: Black.toString(),
      },
    },
  },
});
