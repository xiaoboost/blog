import {
  createStyles,
  createScrollbarWidth,
  createMediaStyles,
  RadiusMd,
  DurationFast,
} from '@blog/styles/compile';
import {
  CodeText,
  CodeBg,
  CodeGutterColor,
  CodeSplit,
  CodeHighlightBg,
  CodeHighlightGutter,
  CodeHighlightMarker,
  CodeSyntaxComment,
  CodeSyntaxKeyword,
  CodeSyntaxFunction,
  CodeSyntaxString,
  CodeSyntaxNumber,
  CodeSyntaxType,
  CodeSyntaxProperty,
  CodeSyntaxOperator,
} from './theme/token';

// 小屏幕时的两边宽度，此值和 layout 中相等
const SmallIndent = 14;
/** 行高 */
const lineHeight = 1.3;

export default createStyles({
  codeBlockActions: {},
  codeBlockLabel: {},
  codeBlockCopy: {},
  codeBlockCopyIcon: {},
  codeBlockCopySuccess: {},
  codeBlockCopyError: {},
  codeBlockCopyStatus: {},
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

    '& $codeBlockActions': {
      position: 'absolute',
      zIndex: 1,
      top: 2,
      right: 6,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 2,
      minHeight: 28,
      color: CodeGutterColor,
      fontSize: '0.8em',
      lineHeight: 1,
      whiteSpace: 'nowrap',
      userSelect: 'none',
    },
    '& $codeBlockLabel': {
      pointerEvents: 'none',
    },

    '& $codeBlockCopy': {
      appearance: 'none',
      display: 'inline-grid',
      placeItems: 'center',
      width: 20,
      height: 28,
      margin: 0,
      padding: 0,
      border: 0,
      outline: 'none',
      borderRadius: RadiusMd,
      backgroundColor: 'transparent',
      color: CodeGutterColor,
      fontSize: 'inherit',
      lineHeight: 1,
      cursor: 'pointer',
      transition: `color ${DurationFast}`,

      '&:hover, &:focus-visible': {
        color: CodeText,
      },
      '& $codeBlockCopyIcon, & $codeBlockCopySuccess, & $codeBlockCopyError': {
        gridArea: '1 / 1',
        display: 'block',
        width: '1em',
        height: '1em',
        opacity: 0,
        pointerEvents: 'none',
        transition: `opacity ${DurationFast} ease`,
      },
      '& $codeBlockCopyIcon': {
        opacity: 1,
      },
      '&[data-copy-state="success"]': {
        color: CodeSyntaxString,
        '& $codeBlockCopySuccess': {
          opacity: 1,
        },
      },
      '&[data-copy-state="error"]': {
        color: CodeSyntaxProperty,
        '& $codeBlockCopyError': {
          opacity: 1,
        },
      },
      '&:not([data-copy-state="idle"]) $codeBlockCopyIcon': {
        opacity: 0,
      },
    },

    '@media (prefers-reduced-motion: reduce)': {
      '& $codeBlockCopy, & $codeBlockCopyIcon, & $codeBlockCopySuccess, & $codeBlockCopyError': {
        transition: 'none',
      },
    },

    '& $codeBlockCopyStatus': {
      position: 'absolute',
      width: 1,
      height: 1,
      padding: 0,
      margin: -1,
      border: 0,
      overflow: 'hidden',
      clipPath: 'inset(50%)',
      whiteSpace: 'nowrap',
    },

    '& code$codeBlockList': {
      margin: 0,
      border: 0,
      borderRadius: RadiusMd,
      minHeight: 32,
      overflow: 'hidden',
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
        backgroundColor: CodeBg,

        '& $codeBlockHighlightLine': {
          color: CodeHighlightGutter,
          boxShadow: `inset 2px 0 ${CodeHighlightMarker}`,
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

        '& > li': {
          position: 'relative',
          padding: '0 34px 0 .4em',
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
    '& .hljs-comment, & .hljs-quote': {
      color: CodeSyntaxComment,
      fontStyle: 'italic',
    },
    '& .hljs-doctag, & .hljs-keyword, & .hljs-formula': {
      color: CodeSyntaxKeyword,
    },
    '& .hljs-section, & .hljs-name, & .hljs-selector-tag, & .hljs-deletion, & .hljs-subst': {
      color: CodeSyntaxProperty,
    },
    '& .hljs-literal': {
      color: CodeSyntaxOperator,
    },
    '& .hljs-string, & .hljs-regexp, & .hljs-addition, & .hljs-attribute, & .hljs-meta .hljs-string': {
      color: CodeSyntaxString,
    },
    '& .hljs-attr, & .hljs-variable, & .hljs-template-variable, & .hljs-type, & .hljs-number': {
      color: CodeSyntaxNumber,
    },
    '& .hljs-selector-class, & .hljs-selector-attr, & .hljs-selector-pseudo': {
      color: CodeSyntaxNumber,
    },
    '& .hljs-symbol, & .hljs-bullet, & .hljs-link, & .hljs-meta, & .hljs-selector-id, & .hljs-title': {
      color: CodeSyntaxFunction,
    },
    '& .hljs-built_in, & .hljs-title.class_, & .hljs-class .hljs-title': {
      color: CodeSyntaxType,
    },
    '& .hljs-emphasis': {
      fontStyle: 'italic',
    },
    '& .hljs-strong': {
      fontWeight: 'bold',
    },
    '& .hljs-link': {
      textDecoration: 'underline',
    },
  },
});
