import { createStyles, BgSecondary, BorderPrimary, ShadowCard, FontHeading } from '@blog/styles';
import { ListTitleFontFamily } from '../../constant/font';
import { PostTitleStyle, PostSubTitleStyle } from '../main-index/index.jss';

export default createStyles({
  itemListItem: {},
  itemListTitle: {},
  itemList: {},
  itemListBody: {
    width: '100%',

    '& $itemListTitle': {
      fontSize: '2.4em',
      margin: [
        0, 10, 20, 10,
      ],
      fontFamily: `${ListTitleFontFamily}, ${FontHeading}`,
    },
    '& $itemList': {
      width: '100%',
      backgroundColor: BgSecondary,
      boxShadow: ShadowCard,
      borderRadius: 4,
      overflow: 'hidden',

      '& $itemListItem': {
        margin: 0,
        padding: [14, 20],
        fontSize: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${BorderPrimary}`,

        '&:last-child': {
          borderBottom: 'none',
        },

        '& a': {
          ...PostTitleStyle,
          fontSize: 16,
          lineHeight: 1,
        },
        '& time': {
          ...PostSubTitleStyle,
        },
      },
    },
  },
});
