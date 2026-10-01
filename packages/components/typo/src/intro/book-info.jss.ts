import {
  AccentPrimary,
  createStyles,
  FontBody,
  FontHeading,
  FontSizeRegular,
  FontSizeXl,
  SecondaryTitleFont,
  TextPrimary,
  TextSecondary,
} from '@blog/styles/compile';

export default createStyles({
  bookLabel: {},
  bookHeading: {},
  bookTitle: {},
  bookSubtitle: {},
  bookMeta: {},
  separatorDot: {},
  bookAuthor: {},
  authorRole: {},
  bookDetails: {},
  bookLink: {},
  sourceIcon: {},
  bookInfo: {
    '&&': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 8,
      minWidth: 0,
      fontFamily: FontBody,
      fontSize: `calc(${FontSizeRegular} - 1px)`,
      lineHeight: 1.8,
      color: TextSecondary,
      textIndent: 0,
      overflowWrap: 'anywhere',

      '& $bookLabel': {
        margin: 0,
        fontWeight: 600,
        lineHeight: 1.6,
        letterSpacing: '.055em',
      },
      '& $bookHeading': {
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minWidth: 0,
        maxWidth: '100%',
      },
      '& $bookTitle': {
        margin: 0,
        color: TextPrimary,
        fontFamily: `${SecondaryTitleFont.fontFamily},${FontHeading}`,
        fontWeight: SecondaryTitleFont.fontWeight,
        fontSize: FontSizeXl,
        lineHeight: 1.5,
      },
      '& $bookSubtitle': {
        margin: [
          -2, 0, 0, 0,
        ],
        color: TextSecondary,
        fontFamily: FontBody,
        fontSize: FontSizeRegular,
        fontWeight: 400,
        lineHeight: 1.6,
      },
      '& $bookMeta': {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0 7px',
        margin: 0,
        padding: 0,
        listStyle: 'none',
        lineHeight: 'inherit',

        '& li': {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          minWidth: 0,
          margin: 0,
          padding: 0,
        },
      },
      '& $separatorDot': {
        display: 'inline-block',
        flexShrink: 0,
        width: 2,
        height: 2,
        borderRadius: '50%',
        backgroundColor: 'currentColor',
      },
      '& $bookAuthor': {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0 4px',
        margin: 0,
      },
      '& $authorRole': {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        whiteSpace: 'nowrap',
      },
      '& $bookDetails': {
        margin: 0,

        '& p': {
          margin: 0,
          textIndent: 0,
          lineHeight: 'inherit',
        },
        '& p + p': {
          marginTop: '.4em',
        },
      },
      '& a:focus-visible': {
        outline: `2px solid ${AccentPrimary}`,
        outlineOffset: 3,
        borderRadius: 2,
      },
      '& $bookLink': {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        margin: 0,
      },
      '& $sourceIcon': {
        flexShrink: 0,
        fontSize: '1em',
      },
      '@media (prefers-reduced-motion: reduce)': {
        '& a': {
          transition: 'none',
        },
      },
    },
  },
});
