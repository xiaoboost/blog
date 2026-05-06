import { createStyles, BgSecondary, BorderPrimary, RadiusMd, ShadowCard, FontHeading, FontSizeMd } from '@blog/styles/compile';
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
      borderRadius: RadiusMd,
      overflow: 'hidden',

      '& $itemListItem': {
        margin: 0,
        padding: [14, 20],
        fontSize: FontSizeMd,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${BorderPrimary}`,

        '&:last-child': {
          borderBottom: 'none',
        },

        '& a': {
          ...PostTitleStyle,
          fontSize: FontSizeMd,
          lineHeight: 1,
        },
        '& time': {
          ...PostSubTitleStyle,
        },
      },
    },
  },
});
