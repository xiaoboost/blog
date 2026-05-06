import { toRound } from '@blog/shared';
import {
  createStyles,
  TextPrimary,
  TextSecondary,
  TextTertiary,
  BgPrimary,
  BgSecondary,
  BorderPrimary,
  ShadowCard,
  FontBody,
  FontHeading,
  FontCode,
  WidthMain,
  RadiusSm,
  RadiusMd,
  createHeadStyles,
  getHeadSelector,
  createMediaStylesByTemplate,
} from '@blog/styles/compile';
import { FirstTitleFontFamily, SecondTitleFontFamily } from '../constant';
import {
  BlockquoteBg,
  TextQuaternary,
  BgTertiary,
  BgCode,
  CodeUnderline,
  EmphasisUnderline,
  EmphasisShadow,
  EmphasisStrongBg,
  EmphasisStrongShadow,
  FontEm,
} from '../theme/token';

const indent = 24;
const smallIndent = 14;

export default createStyles({
  postAnchor: {},
  postHeader: {},
  postHeaderTitle: {},
  postHeaderCreate: {},
  postArticle: {},
  postNoToc: {},
  postSoftBreak: {},
  noIndent: {},
  splitMark: {},
  blockquoteIcon: {},
  postDefault: {
    color: TextPrimary,
    backgroundColor: BgSecondary,
    boxShadow: ShadowCard,
    width: WidthMain,
    flexGrow: 0,
    flexShrink: 0,
    borderRadius: RadiusMd,
    overflow: 'hidden',

    ...createMediaStylesByTemplate<number | string>(
      (width) => ({
        width: typeof width === 'number' ? `${width}px` : String(width),
      }),
      {
        pc: 900,
        phone: '100%',
      },
    ),

    '&$postNoToc': {
      width: '100%',
    },
    '& $postHeader': {
      display: 'flex',
      minHeight: 50,
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: `1px solid ${BorderPrimary}`,

      ...createMediaStylesByTemplate(
        (width) => ({ margin: `0 ${width}px` }),
        { pc: indent, phone: smallIndent },
      ),
    },
    '& $postHeaderTitle': {
      fontFamily: `${FirstTitleFontFamily},${FontHeading}`,
      color: TextPrimary,
      fontSize: 28,
      margin: 0,
      padding: 0,
      whiteSpace: 'wrap',
      width: 'calc(100% - 100px)',
    },
    '& $postHeaderCreate': {
      color: TextTertiary,
      fontSize: 13,
      fontWeight: 'normal',
      fontFamily: FontBody,
    },
    '& $postArticle': {
      fontSize: 16,
      ...createMediaStylesByTemplate(
        (width) => ({ padding: `16px ${width}px` }),
        { pc: indent, phone: smallIndent },
      ),
      ...createHeadStyles('& ', (level) => ({
        fontFamily: `${level === 1 ? FirstTitleFontFamily : SecondTitleFontFamily},${FontHeading}`,
        textShadow: level === 1 ? 'none' : '0.05px 0 0 currentColor',
        fontSize: `${toRound(1.5 - 0.15 * (level - 1))}em`,
        marginTop: `${toRound(1.2 - 0.1 * (level - 1))}em`,
        marginBottom: `${toRound(0.9 - 0.05 * (level - 1))}em`,
        lineHeight: '1.3',
      })),
      [getHeadSelector('& ')]: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        ...createMediaStylesByTemplate(
          (width) => ({
            marginLeft: `${-1 * width}px`,
            marginRight: `${-1 * width}px`,
          }),
          { pc: indent, phone: smallIndent },
        ),
        '& $postAnchor': {
          fontSize: '.8em',
          color: TextSecondary,
          cursor: 'pointer',
          opacity: 0,
          width: indent,
          transition: 'opacity .2s',
          boxSizing: 'border-box',
          textAlign: 'center',
        },
        '&:hover $postAnchor': {
          opacity: 1,
        },
      },
      '& span$postSoftBreak': {
        display: 'inline-block',
        width: '2em',
      },
      '& > *:first-child': {
        marginTop: '0 !important',
      },
      '& p': {
        lineHeight: 1.75,
        textIndent: '2em',
        margin: '0 0 1em 0',

        '&:last-child': {
          marginBottom: 0,
        },
        '&$noIndent': {
          textIndent: '0',
        },
      },
      '& code, & pre': {
        fontFamily: FontCode,
      },
      '& code': {
        margin: '0 0.2em',
        padding: '0.2em',
        fontSize: '0.85em',
        backgroundColor: BgCode,
        borderBottom: `0.1em solid ${CodeUnderline}`,
        top: -1.5,
        borderRadius: RadiusSm,
        position: 'relative',
      },
      '& em': {
        margin: '0 2px',
        fontStyle: 'normal',
        textDecoration: 'none',
        fontFamily: FontEm,
        backgroundImage: EmphasisUnderline,
        textShadow: EmphasisShadow,

        // 三个✳的强调，样式和普通的强调有所不同
        '& > strong': {
          backgroundRepeat: 'no-repeat',
          backgroundSize: '100% 40%',
          backgroundPosition: '0 85%',
          borderRadius: RadiusSm,
          boxDecorationBreak: 'clone',
          fontWeight: 'bold',
          webkitBoxDecorationBreak: 'clone',
          backgroundImage: EmphasisStrongBg,
          // 这里下面的方向是 2.5，多出来的 0.5 是为了遮住 em 原本的 2px 下划线
          padding: [
            0, 2, 2.5, 2,
          ],
          textShadow: EmphasisStrongShadow,
        },
      },
      '& s': {
        textDecorationColor: TextTertiary,
      },
      '& small': {
        fontSize: '0.8em',
      },
      '& sub,sup': {
        fontSize: '0.8em',
        marginRight: '.2em',
        lineHeight: 0,
        position: 'relative',
        verticalAlign: 'baseline',
      },
      '& sup': {
        top: '-0.5em',
      },
      '& sub': {
        bottom: '-0.3em',
      },
      '& ul, & ol': {
        lineHeight: 1.5,
        paddingLeft: '1.8em',
        marginLeft: '0.5em',

        '& li': {
          marginBottom: '0.2em',
          '&:last-child': {
            marginBottom: 0,
          },
        },
        '& ol': {
          counterReset: 'list-counter',
          '& li': {
            counterIncrement: 'list-counter',
            position: 'relative',
          },
        },
      },
      '& blockquote': {
        position: 'relative',
        padding: '.8em 1.2em',
        margin: '1em 0',
        lineHeight: 1.5,
        fontSize: '90%',
        borderLeft: `0.3em solid ${TextQuaternary}`,
        backgroundColor: BlockquoteBg,

        '& $blockquoteIcon': {
          position: 'absolute',
          top: 6,
          left: 12,
          fontSize: 20,
          zIndex: 0,
          color: TextQuaternary,
        },

        '> *': {
          marginTop: 0,
          marginBottom: '.5em',

          '&:last-child': {
            marginBottom: 0,
          },
        },
      },
      '& table': {
        display: 'block',
        width: 'max-content',
        maxWidth: '100%',
        overflow: 'auto',
        margin: '0 auto 0.8em',
        borderSpacing: 0,
        borderCollapse: 'collapse',

        '& tr': {
          backgroundColor: BgPrimary,
          borderTop: `1px solid ${BorderPrimary}`,
        },
        '& tbody tr:nth-child(2n+1)': {
          backgroundColor: BgTertiary,
        },
        '& th, & td': {
          padding: [6, 13],
          border: `1px solid ${BorderPrimary}`,
        },
        '& th': {
          fontWeight: 600,
        },
      },
      '& hr': {
        height: 1,
        padding: 0,
        margin: [24, 0],
        backgroundColor: 'transparent',
        border: 'none',
        overflow: 'hidden',
        boxSizing: 'content-box',
        borderBottom: `1px solid ${BorderPrimary}`,
      },
      '& $splitMark': {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 0,
        margin: [20, 0],
        color: TextTertiary,

        '&::before, &::after': {
          content: '""',
          width: 80,
          height: 1,
          backgroundColor: BorderPrimary,
          margin: [0, 15],
        },

        '& > span': {
          fontSize: 20,
          fontFamily: FontHeading,
        },
      },
    },
  },
});
