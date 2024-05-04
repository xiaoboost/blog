import { createStyles, White, Shadow, Gray } from '@blog/styles';
import { PostTitleStyle, PostSubTitleStyle } from '../main-index/index.jss';

export default createStyles({
  itemListItem: {},
  itemListTitle: {},
  itemList: {},
  itemListBody: {
    width: '100%',

    '& $itemListTitle': {
      fontSize: '2.4em',
      margin: [0, 10, 20, 10],
    },
    '& $itemList': {
      width: '100%',
      backgroundColor: White.toString(),
      boxShadow: `0 1px 3px ${Shadow.toString()}`,

      '& $itemListItem': {
        margin: 0,
        padding: [14, 20],
        fontSize: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${Gray.toString()}`,

        '& a': {
          ...PostTitleStyle,
          fontSize: 16,
        },
        '& time': {
          ...PostSubTitleStyle,
        },
      },
    },
  },
});
