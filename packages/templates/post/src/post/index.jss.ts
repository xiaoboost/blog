import {
  createStyles,
  articleWidth,
  Color,
  Black,
  White,
  Shadow,
  WhiteBg,
  GrayLight,
  BlackLight,
  BlackLighter,
  BlackExtraLight,
  YellowLight,
  YellowLighter,
  FontDefault,
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
const linkColor = Color.rgb(23, 81, 153).alpha(0.6);
const linkHoverColor = Color.rgb(23, 81, 153);

export default createStyles({
  postAnchor: {},
  postHeader: {},
  postHeaderTitle: {},
  postHeaderCreate: {},
  postArticle: {},
  postNoToc: {},
  postSoftBreak: {},
  noIndent: {},
  postDefault: {
    color: Black.toString(),
    backgroundColor: White.toString(),
    boxShadow: `0 1px 3px ${Shadow.toString()}`,
    width: articleWidth,
    flexGrow: 0,
    flexShrink: 0,

    ...createMediaStyles<number | string>(articleWidth, '100%', (width) => ({
      width: typeof width === 'number' ? `${width}px` : width,
    })),

    '&$postNoToc': {
      width: '100%',
    },
    '& $postHeader': {
      display: 'flex',
      height: 50,
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: `1px solid ${GrayLight.toString()}`,

      ...createMediaStyles(indent, smallIndent, (width) => ({
        margin: `0 ${width}px`,
      })),
    },
    '& $postHeaderTitle': {
      color: Black.toString(),
      fontSize: 28,
      margin: 0,
      padding: 0,
    },
    '& $postHeaderCreate': {
      color: BlackLighter.toString(),
      fontSize: 12,
      fontWeight: 'normal',
      fontFamily: FontDefault,
    },
    '& $postArticle': {
      fontSize: 14,
      ...createMediaStyles(indent, smallIndent, (width) => ({
        padding: `16px ${width}px`,
      })),
      ...createHeadStyles('& ', (level) => ({
        fontSize: `${toRound(1.6 - 0.2 * (level - 1))}em`,
        marginTop: `${toRound(1.1 - 0.1 * (level - 1))}em`,
        marginBottom: `${toRound(0.8 - 0.05 * (level - 1))}em`,
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
        lineHeight: 1.7,
        textIndent: '2em',
        margin: '0 0 0.8em 0',

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
        margin: '0 3px',
        fontStyle: 'normal',
        textDecoration: 'none',
        // eslint-disable-next-line max-len
        backgroundImage: `linear-gradient(to top, transparent, transparent 0px, ${BlackLighter.toString()} 0px, ${BlackLighter.toString()} 1px, transparent 1px)`,
        // eslint-disable-next-line max-len
        textShadow: `-1px -1px 0 #fafafa, 1px -1px 0 ${WhiteBg.toString()}, -1px 1px 0 ${WhiteBg.toString()}, 1px 1px ${WhiteBg.toString()}`,
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
      '& a': {
        cursor: 'pointer',
        color: linkColor.toString(),
        textDecoration: 'none',
        transition: 'color .2s, background .4s',

        '&:hover, &:focus': {
          outline: 0,
          color: linkHoverColor.toString(),
        },
      },
      '& ul, & ol': {
        lineHeight: 1.4,
        paddingLeft: '1.5em',
        marginLeft: '0.4em',
      },
      '& blockquote': {
        padding: '.8em 1.2em',
        margin: '1em 0',
        lineHeight: 1.5,
        fontSize: '90%',
        borderLeft: `0.3em solid ${BlackExtraLight.darken(0.05).toString()}`,
        backgroundColor: WhiteBg.toString(),

        '> *': {
          marginTop: 0,
          marginBottom: '.4em',

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
        margin: '0 0 0.8em 0',
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
      '& img': {
        maxWidth: '100%',
      },
    },
  },
});
