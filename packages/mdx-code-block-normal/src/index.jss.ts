import {
  createStyles,
  createScrollbarWidth,
  BlackLight,
  WhiteBg,
  Gray,
  BlackExtraLight,
  mediaPhone,
  Color,
} from '@blog/styles';

const CodeColor = Color(BlackLight);
const CodeBgColor = Color(WhiteBg);
const SplitColor = Color(Gray);
const highlightBgColor = Color(BlackExtraLight);
const GutterBgColor = Color(CodeBgColor.rgbNumber() - 0x101010);
const GutterColor = Color(GutterBgColor.rgbNumber() - 0x303030);
const borderRadius = 4;

// 小屏幕时的两边宽度，此值和 layout 中相等
const SmallIndent = 14;
/** 行高 */
const lineHeight = 1.3;

export default createStyles({
  '@import': '\'highlight.js/styles/atom-one-light.css\'',
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

    [mediaPhone]: {
      marginLeft: -1 * SmallIndent,
      marginRight: -1 * SmallIndent,
    },

    '& $codeBlockLabel': {
      position: 'absolute',
      color: GutterColor.toString(),
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
        color: GutterColor.toString(),
        backgroundColor: GutterBgColor.toString(),
        borderTopLeftRadius: borderRadius,
        borderBottomLeftRadius: borderRadius,

        [mediaPhone]: {
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
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

      [mediaPhone]: createScrollbarWidth(4, '&'),

      '& $codeBlockCode': {
        padding: '.4em 0',
        margin: 0,
        flexGrow: 1,
        flexShrink: 0,
        listStyleType: 'none',
        color: CodeColor.toString(),
        backgroundColor: CodeBgColor.toString(),
        borderTopRightRadius: borderRadius,
        borderBottomRightRadius: borderRadius,

        [mediaPhone]: {
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
        },

        '& > li': {
          position: 'relative',
          padding: '0 .4em',
          margin: 0,
          lineHeight,
        },

        '& > li:after': {
          content: `" "`,
        },
      },
    },

    '& $codeBlockSplit': {
      width: 1,
      height: '100%',
      position: 'absolute',
      backgroundColor: SplitColor.toString(),
    },

    '& $codeBlockHighlightLine': {
      backgroundColor: highlightBgColor.toString(),
    },
  },
});
