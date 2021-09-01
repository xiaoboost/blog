import { createStyles, mainWidth, mediaPhone, headerBodyMargin } from '@blog/styles';

export default createStyles({
  mainArticle: {},
  mainArticleWrapper: {
    flex: '1 auto',
    display: 'flex',
    justifyContent: 'center',

    '& $mainArticle': {
      display: 'flex',
      width: mainWidth,
      position: 'relative',
      marginTop: headerBodyMargin,
      justifyContent: 'flex-start',
      alignItems: 'flex-start',

      [mediaPhone]: {
        width: '100vw',
      },
    },
  },
});
