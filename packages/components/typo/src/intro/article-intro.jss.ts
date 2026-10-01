import {
  BorderPrimary,
  createStyles,
  FontBody,
  FontSizeMd,
  FontSizeRegular,
  TextPrimary,
  TextSecondary,
} from '@blog/styles/compile';

export default createStyles({
  withAside: {},
  introAside: {},
  introContent: {},
  introLabel: {
    margin: '0 0 8px',
    color: TextSecondary,
    fontFamily: FontBody,
    fontSize: `calc(${FontSizeRegular} - 1px)`,
    fontWeight: 600,
    lineHeight: 1.6,
    letterSpacing: '.055em',
  },
  introLead: {
    // 正文模板有全局段落规则，这里保留导读自己的段距和无缩进排版。
    '&&&': {
      '& p': {
        margin: 0,
        lineHeight: 'inherit',
        textIndent: 0,
      },
      '& p + p': {
        marginTop: '.6em',
      },
      '& > :first-child': {
        marginTop: 0,
      },
      '& > :last-child': {
        marginBottom: 0,
      },
    },
  },
  articleIntro: {
    margin: '8px 0 26px',
    padding: '8px 0 24px',
    borderBottom: `1px solid ${BorderPrimary}`,
    color: TextPrimary,
    fontFamily: FontBody,
    fontSize: FontSizeMd,
    lineHeight: 1.85,
    textIndent: 0,
    overflowWrap: 'anywhere',

    '&$withAside': {
      display: 'grid',
      gridTemplateColumns: 'minmax(180px, 29%) minmax(0, 1fr)',
      gap: 24,
      alignItems: 'start',
    },
    '& $introAside': {
      minWidth: 0,
      paddingRight: 24,
      borderRight: `1px solid ${BorderPrimary}`,
    },
    '& $introContent': {
      minWidth: 0,
    },
    '@media (max-width: 600px)': {
      '&$withAside': {
        gridTemplateColumns: 'minmax(0, 1fr)',
        gap: 24,
      },
      '& $introAside': {
        paddingRight: 0,
        borderRight: 'none',
      },
    },
  },
});
