import { createStyles } from '@blog/styles';

const fontStyle = createStyles({
  '@font-face': {
    fontFamily: 'Test',
    fontWeight: 'normal',
    fontStyle: 'normal',
    src: `url("../assets/font/dancing/dancing.woff2") format("woff2")`,
  },
});

export default fontStyle;
