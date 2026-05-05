import { createStyles, WidthMain, mediaPhone } from '@blog/styles';
import { SpacingHeaderBody } from '../../styles/theme';

export default createStyles({
  mainArticle: {},
  mainArticleWrapper: {
    flex: '1 auto',
    display: 'flex',
    justifyContent: 'center',

    '& $mainArticle': {
      display: 'flex',
      width: WidthMain,
      position: 'relative',
      marginTop: SpacingHeaderBody,
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      flexDirection: 'column',

      [mediaPhone]: {
        width: '100vw',
      },
    },
  },
});
