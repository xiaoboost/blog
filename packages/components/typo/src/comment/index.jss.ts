import { createStyles, createThemeStyles, createToken, FontSizeRegular, Gray } from '@blog/styles/compile';

const [CommentCornerColorToken, CommentCornerColor] = createToken('comment-corner-color');

export default createStyles({
  comment: {
    ...createThemeStyles({
      light: {
        color: Gray[500].toString(),
        [CommentCornerColorToken]: Gray[300].toString(),
      },
      dark: {
        color: Gray[400].toString(),
        [CommentCornerColorToken]: Gray[500].toString(),
      },
    }),
    position: 'relative',
    boxSizing: 'border-box',
    margin: '0 clamp(12px, 4%, 26px) 22px',
    padding: '9px 14px',
    fontSize: FontSizeRegular,
    lineHeight: 1.85,
    textIndent: 0,
    overflowWrap: 'anywhere',

    // 压过文章默认段落样式，保留旁注自己的行高、段距和无缩进排版。
    '&&& > p': {
      margin: 0,
      textIndent: 0,
      lineHeight: 'inherit',
    },
    '&&& > p + p': {
      marginTop: '0.6em',
    },
    '&::before, &::after': {
      content: '""',
      position: 'absolute',
      boxSizing: 'border-box',
      width: 12,
      height: 12,
      borderColor: CommentCornerColor,
      borderStyle: 'solid',
      pointerEvents: 'none',
    },
    '&::before': {
      top: 0,
      left: 0,
      borderWidth: '1px 0 0 1px',
    },
    '&::after': {
      right: 0,
      bottom: 0,
      borderWidth: '0 1px 1px 0',
    },
  },
});
