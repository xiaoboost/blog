import { createStyles, BlackLight } from '@blog/styles';

export default createStyles({
  postImageAlt: {},
  postImageInner: {},
  postImageBox: {
    margin: [14, 0],
    textAlign: 'center',
    maxWidth: '100%',

    '& $postImageAlt': {
      color: BlackLight.toString(),
      fontSize: 12,
      fontWeight: 300,
      lineHeight: '1.5',
      margin: '12px 0',
      textAlign: 'center',
    },
    '& $postImageInner': {
      cursor: 'zoom-in',
      maxWidth: '100%',
    },
  },
});
