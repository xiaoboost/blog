import { createStyles, White, Gray, MainShadow, FontSerif } from '@blog/styles';
import { PostTitleStyle, PostSubTitleStyle } from '../main-index/index.jss';
import { ListTitleFontFamily } from '../../utils/font';

export default createStyles({
  itemListItem: {},
  itemListTitle: {},
  itemList: {},
  itemListBody: {
    width: '100%',

    '& $itemListTitle': {
      fontSize: '2.4em',
      margin: [0, 10, 20, 10],
      fontFamily: `${ListTitleFontFamily}, ${FontSerif}`,
    },
    '& $itemList': {
      width: '100%',
      backgroundColor: White.toString(),
      boxShadow: MainShadow,
      borderRadius: 4,
      overflow: 'hidden',

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
