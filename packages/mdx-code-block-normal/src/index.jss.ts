import {
  createStyles,
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

export default createStyles({
  '@import': '\'highlight.js/styles/atom-one-light.css\'',
  codeBlockLabel: {},
  codeBlockList: {},
  codeBlockWrapper: {},
  codeBlockGutter: {},
  codeBlockCode: {},
  codeBlockSplit: {},
  codeBlockHighlightLine: {},
  codeBlock: {
    textShadow: 'none',
    position: 'relative',
    fontSize: '0.9em',
    margin: '.8em 0',
    backgroundColor: 'transparent',

    [mediaPhone]: {
      marginLeft: -1 * SmallIndent,
      marginRight: -1 * SmallIndent,

      // TODO: setScrollbarWidth(),
    },

    '& ul': {
      padding: 0,
      margin: 0,
      listStyleType: 'none',
    },

    '& li': {
      padding: 0,
      margin: 0,
      lineHeight: 1.3,
    },

    '& $codeBlockLabel': {
      position: 'absolute',
      color: GutterColor.toString(),
      backgroundColor: 'transparent',
      fontSize: '0.8em',
      right: 4,
      top: 4,
    },

    '& $codeBlockList': {
      margin: 0,
      border: 0,
      padding: 0,
      display: 'flex',
      flexWrap: 'nowrap',
      flexDirection: 'row',
      overflowWrap: 'normal',
      whiteSpace: 'inherit',
      backgroundColor: 'transparent',
    },

    '& $codeBlockWrapper': {
      flexShrink: 1,
      flexGrow: 1,
      overflowX: 'auto',
      display: 'inline-flex',
    },

    '& $codeBlockGutter': {
      float: 'left',
      padding: '.4em 0',
      flexShrink: 0,
      flexGrow: 0,
      color: GutterColor.toString(),
      backgroundColor: GutterBgColor.toString(),
      borderTopLeftRadius: borderRadius.toString(),
      borderBottomLeftRadius: borderRadius.toString(),

      [mediaPhone]: {
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
      },

      '& > li': {
        textAlign: 'right',
        paddingLeft: '.4em',
        paddingRight: '.5em',
      },
    },

    '& $codeBlockCode': {
      padding: '.4em 0',
      flexGrow: 1,
      flexShrink: 0,
      color: CodeColor.toString(),
      backgroundColor: CodeBgColor.toString(),
      borderTopRightRadius: borderRadius.toString(),
      borderBottomRightRadius: borderRadius.toString(),

      [mediaPhone]: {
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
      },

      '& > li': {
        position: 'relative',
        paddingLeft: '.4em',
        paddingRight: '.4em',
      },

      '& > li:after': {
        content: `"　"`,
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
