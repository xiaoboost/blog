import { createStyles } from '@blog/shared/styles';

export default createStyles({
  iconBox: {
    display: 'inline-block',
    color: 'inherit',
    fontStyle: 'normal',
    lineHeight: 0,
    textAlign: 'center',
    textTransform: 'none',
    textRendering: 'optimizelegibility',

    '& svg': {
      display: 'inline-block',
    },
  },
});
