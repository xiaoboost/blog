import {
  createStyles,
  mainWidth,
  Color,
  Black,
  White,
  WhiteBg,
  Gray,
  BlackLight,
  BlackLighter,
  BlackExtraLight,
  YellowLight,
  YellowLighter,
  FontDefault,
  FontSerif,
  MainShadow,
  createMediaStyles,
  createHeadStyles,
  getHeadSelector,
} from '@blog/styles';

import { toRound } from '@blog/shared';

const indent = 24;
const smallIndent = 14;
const tableHeaderBorderColor = Color.hsl(210, 18, 87, 1);
const tableBorderColor = Color(0xd0d7de);
const tableRowBgColor = Color(0xf6f9fa);

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
  postDefault: {
    color: Black.toString(),
    backgroundColor: White.toString(),
    boxShadow: MainShadow,
    width: mainWidth,
    flexGrow: 0,
    flexShrink: 0,
    borderRadius: 4,
    overflow: 'hidden',

    ...createMediaStyles<number | string>(mainWidth, '100%', (width) => ({
      width: typeof width === 'number' ? `${width}px` : width,
    })),

    '&$postNoToc': {
      width: '100%',
    },
    '& $postHeader': {
      display: 'flex',
      minHeight: 50,
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: `1px solid ${Gray.toString()}`,

      ...createMediaStyles(indent, smallIndent, (width) => ({
        margin: `0 ${width}px`,
      })),
    },
    '& $postHeaderTitle': {
      color: Black.toString(),
      fontSize: 28,
      margin: 0,
      padding: 0,
      whiteSpace: 'wrap',
      width: 'calc(100% - 100px)',
    },
    '& $postHeaderCreate': {
      color: BlackLighter.toString(),
      fontSize: 13,
      fontWeight: 'normal',
      fontFamily: FontDefault,
    },
    '& $postArticle': {
      fontSize: 16,
      ...createMediaStyles(indent, smallIndent, (width) => ({
        padding: `16px ${width}px`,
      })),
      ...createHeadStyles('& ', (level) => ({
        fontSize: `${toRound(1.5 - 0.15 * (level - 1))}em`,
        marginTop: `${toRound(1.2 - 0.1 * (level - 1))}em`,
        marginBottom: `${toRound(0.9 - 0.05 * (level - 1))}em`,
        lineHeight: '1.3',
        fontWeight: level === 1 ? '700' : '600',
      })),
      [getHeadSelector('& ')]: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        ...createMediaStyles(indent, smallIndent, (indent) => ({
          marginLeft: `${-1 * indent}px`,
          marginRight: `${-1 * indent}px`,
        })),
        '& $postAnchor': {
          fontSize: '.8em',
          color: BlackLight.toString(),
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
      '& code': {
        margin: '0 0.2em',
        padding: '0.2em',
        fontSize: '0.85em',
        backgroundColor: YellowLighter.toString(),
        borderBottom: `0.1em solid ${YellowLight.toString()}`,
        top: -1.5,
        borderRadius: 2,
        position: 'relative',
      },
      '& em': {
        margin: '0 2px',
        fontStyle: 'normal',
        textDecoration: 'none',
        backgroundImage: `linear-gradient(
          to top,
          transparent,
          transparent 0px,
          ${BlackLighter.toString()} 0px,
          ${BlackLighter.toString()} 1px,
          transparent 1px
        )`,
        textShadow: `
          -1px -1px 0 #fafafa,
          1px -1px 0 ${WhiteBg.toString()},
          -1px 1px 0 ${WhiteBg.toString()},
          1px 1px ${WhiteBg.toString()}
        `,

        // 三个✳的强调，样式和普通的强调有所不同
        '& > strong': {
          backgroundRepeat: 'no-repeat',
          backgroundSize: '100% 40%',
          backgroundPosition: '0 85%',
          borderRadius: 2,
          boxDecorationBreak: 'clone',
          fontWeight: 'bold',
          webkitBoxDecorationBreak: 'clone',
          backgroundImage: `linear-gradient(
            120deg,
            ${Gray.toString()} 0%,
            ${Gray.toString()} 100%
          )`,
          // 这里下面的方向是 2.5，多出来的 0.5 是为了遮住 em 原本的 2px 下划线
          padding: [0, 2, 2.5, 2],
          textShadow: `
            -0.8px -0.8px 0 #fafafa,
            0.8px -0.8px 0 ${WhiteBg.toString()},
            -0.8px 0.8px 0 ${WhiteBg.toString()},
            0.8px 0.8px ${WhiteBg.toString()}
          `,
        },
      },
      '& s': {
        textDecorationColor: 'rgba(32, 32, 32, 0.5)',
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
        borderLeft: `0.3em solid ${BlackExtraLight.darken(0.04).toString()}`,
        backgroundColor: WhiteBg.alpha(0.8).toString(),

        '&::before': {
          content: '"“"',
          position: 'absolute',
          top: -4,
          fontSize: 40,
          fontFamily: FontSerif,
          color: BlackExtraLight.toString(),
          zIndex: 0,
          width: 32,
          height: 32,

          ...createMediaStyles(-4, 12, (offset) => ({
            left: `${offset}px`,
          })),
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
          backgroundColor: White.toString(),
          borderTop: `1px solid ${tableHeaderBorderColor.toString()}`,
        },
        '& tbody tr:nth-child(2n+1)': {
          backgroundColor: tableRowBgColor.toString(),
        },
        '& th, & td': {
          padding: [6, 13],
          border: `1px solid ${tableBorderColor.toString()}`,
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
        borderBottom: `1px solid ${Gray.toString()}`,
      },
      '& $splitMark': {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 0,
        margin: [20, 0],
        color: BlackLighter.toString(),

        '&::before, &::after': {
          content: '""',
          width: 80,
          height: 1,
          backgroundColor: Gray.toString(),
          margin: [0, 15],
        },

        '& > span': {
          fontSize: 20,
          fontFamily: FontSerif,
        },
      },
    },
  },
});
