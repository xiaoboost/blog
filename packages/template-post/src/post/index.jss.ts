import {
  createStyles,
  articleWidth,
  mainWidth,
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
  getHeadSelector,
} from '@blog/styles';

const indent = 24;
const smallIndent = 14;

export default createStyles({
  postAnchor: {},
  postHeader: {},
  postHeaderTitle: {},
  postHeaderCreate: {},
  postArticle: {},
  postNoToc: {},
  postDefault: {
    color: Black.toString(),
    backgroundColor: White.toString(),
    boxShadow: `0 1px 3px ${Shadow.toString()}`,
    width: articleWidth,
    flexGrow: 0,
    flexShrink: 0,

    '&$postNoToc': {
      width: mainWidth,
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
      '& > *:first-child': {
        marginTop: '0 !important',
      },
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
      '& p': {
        lineHeight: 1.7,
        textIndent: '2em',
        margin: '0 0 0.8em 0',

        '&:last-child': {
          marginBottom: 0,
        },
      },
      '& code': {
        margin: '0 0.2em',
        padding: '0.2em',
        fontSize: '0.85em',
        backgroundColor: YellowLighter.toString(),
        borderBottom: `0.1em solid ${YellowLight.toString()}`,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
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
        color: BlackLighter.toString(),
        textDecoration: 'none',
        transition: 'color .2s, background .4s',

        '&:hover, &:focus': {
          outline: 0,
          color: Black.toString(),
        },
      },
      '& ul, & ol': {
        paddingLeft: '1.5em',
        lineHeight: 1.4,
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
    },
  },
});