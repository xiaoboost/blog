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

export default createStyles({
  postsListItemFooter: {},
  postsListItemDescription: {},
  postsListItemHeader: {},
  postsListItem: {},
  postsList: {
    color: Black.toString(),
    backgroundColor: White.toString(),
    boxShadow: `0 1px 3px ${Shadow.toString()}`,
    width: '100%',

    '& $postsListItem': {
      margin: 0,
      padding: '16px 20px',
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
        color: Black.toString(),
        lineHeight: 1,
        fontSize: 20,
        fontWeight: 600,
        fontFamily: FontSerif,
      },
      '& time': {
        color: BlackLighter.toString(),
        fontSize: 12,
        fontWeight: 'normal',
        fontFamily: FontDefault,
      },
    },
    '& $postsListItemDescription': {
      fontSize: 14,
      marginTop: 10,
    },
    '& $postsListItemFooter': {
      fontSize: 12,
      marginTop: 10,
    },
  },
});
