import {
  createStyles,
  createScrollbarWidth,
  createMediaStyles,
  RadiusSm,
} from '@blog/styles';
import {
  CodeText,
  CodeBg,
  CodeGutterBg,
  CodeGutterColor,
  CodeSplit,
  CodeHighlightBg,
  CodeHighlightGutter,
} from './theme';

// 小屏幕时的两边宽度，此值和 layout 中相等
const SmallIndent = 14;
/** 行高 */
const lineHeight = 1.3;

export default createStyles({
  '@import': "'highlight.js/styles/atom-one-light.css'",
  codeBlockLabel: {},
  codeBlockList: {},
  codeBlockBox: {},
  codeBlockGutter: {},
  codeBlockCode: {},
  codeBlockSplit: {},
  codeBlockHighlightLine: {},
  codeBlockWrapper: {
    textShadow: 'none',
    position: 'relative',
    fontSize: '0.9em',
    margin: '.8em 0',
    backgroundColor: 'transparent',

    ...createMediaStyles({
      phone: {
        marginLeft: `${-1 * SmallIndent}px`,
        marginRight: `${-1 * SmallIndent}px`,
      },
    }),

    '& $codeBlockLabel': {
      position: 'absolute',
      color: CodeGutterColor,
      backgroundColor: 'transparent',
      fontSize: '0.8em',
      right: 4,
      top: 4,
    },

    '& code$codeBlockList': {
      margin: 0,
      border: 0,
      padding: 0,
      display: 'flex',
      flexWrap: 'nowrap',
      flexDirection: 'row',
      overflowWrap: 'normal',
      whiteSpace: 'inherit',
      position: 'initial',
      backgroundColor: 'transparent',

      '& ul$codeBlockGutter': {
        float: 'left',
        padding: '.4em 0',
        margin: 0,
        flexShrink: 0,
        flexGrow: 0,
        listStyleType: 'none',
        color: CodeGutterColor,
        backgroundColor: CodeGutterBg,
        borderTopLeftRadius: RadiusSm,
        borderBottomLeftRadius: RadiusSm,

        ...createMediaStyles({
          phone: {
            borderTopLeftRadius: '0px',
            borderBottomLeftRadius: '0px',
          },
        }),

        '& $codeBlockHighlightLine': {
          color: CodeHighlightGutter,
        },

        '& > li': {
          textAlign: 'right',
          margin: 0,
          padding: '0 .5em 0 .4em',
          lineHeight,
        },
      },
    },

    '& $codeBlockBox': {
      flexShrink: 1,
      flexGrow: 1,
      overflowX: 'auto',
      display: 'inline-flex',

      ...createMediaStyles({
        phone: createScrollbarWidth(4, '&'),
      }),

      '& $codeBlockCode': {
        padding: '.4em 0',
        margin: 0,
        flexGrow: 1,
        flexShrink: 0,
        listStyleType: 'none',
        color: CodeText,
        backgroundColor: CodeBg,
        borderTopRightRadius: RadiusSm,
        borderBottomRightRadius: RadiusSm,

        ...createMediaStyles({
          phone: {
            borderTopLeftRadius: '0px',
            borderBottomLeftRadius: '0px',
          },
        }),

        '& > li': {
          position: 'relative',
          padding: '0 .4em',
          margin: 0,
          lineHeight,
        },

        '& > li:after': {
          content: '" "',
        },
      },
    },

    '& $codeBlockSplit': {
      width: 1,
      height: '100%',
      position: 'absolute',
      backgroundColor: CodeSplit,
    },

    '& $codeBlockHighlightLine': {
      backgroundColor: CodeHighlightBg,
    },
  },
});
