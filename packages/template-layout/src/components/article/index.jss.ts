import { createStyles, mainWidth, mediaPhone } from '@blog/styles';

export default createStyles({
  mainArticle: {},
  mainArticleWrapper: {
    flex: '1 auto',
    display: 'flex',
    justifyContent: 'center',

    '& $mainArticle': {
      display: 'flex',
      width: mainWidth,

      [mediaPhone]: {
        width: '100vw',
      },
    },
  },
});
