import { createStyles } from '@blog/styles/compile';

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
