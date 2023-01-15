import { createStyles, Color, FontMono, Gray, GrayLight } from '@blog/styles';

export default createStyles({
  fontBlock: {},
  fontBlockHorizontal: {},
  fontBlockVertical: {},
  fontBlockLeft: {},
  fontBlockRight: {},
  fontBlockCenter: {},
  fontBlockNoIndent: {
    '& p': {
      textAlign: 0,
    },
  },
});
