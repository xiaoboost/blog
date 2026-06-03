import {
  createStyles,
  FontBody,
  FontSizeRegular,
  TextTertiary,
} from '@blog/styles/compile';

export default createStyles({
  subtitle: {
    // 三层 class 嵌套提升特异性 (0,0,3,0)，压过 .post-article p 的 (0,0,2,1)
    '&&&': {
      display: 'flex',
      alignItems: 'center',
      fontFamily: FontBody,
      fontSize: FontSizeRegular,
      color: TextTertiary,
      margin: '-0.8em 0 1.2em 0',
      textIndent: 0,
      lineHeight: 1.5,
    },
    '&::before': {
      content: '""',
      display: 'inline-block',
      width: '1.8em',
      height: 0,
      borderBottom: '1px solid currentColor',
      marginRight: '0.4em',
      flexShrink: 0,
    },
  },
  noDash: {
    '&::before': {
      display: 'none',
    },
  },
});
