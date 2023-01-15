import { createStyles } from '@blog/styles';

export default createStyles({
  fontBlock: {
    margin: [14, 0],
  },
  fontBlockHorizontal: {
    direction: 'ltr',
    writingMode: 'horizontal-tb',
  },
  fontBlockVertical: {
    direction: 'ltr',
    writingMode: 'vertical-lr',
  },
  fontBlockVerticalRight: {
    direction: 'rtl',
    writingMode: 'vertical-lr',
  },
  fontBlockNoIndent: {
    '& p': {
      textIndent: '0 !important',
    },
  },
});
