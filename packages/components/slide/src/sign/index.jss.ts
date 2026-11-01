import {
  createStyles,
  FontHeading,
  SiteTitleFontFamily,
} from '@blog/styles/compile';

export default createStyles({
  sign: {
    display: 'inline-flex',
    alignItems: 'baseline',
    fontFamily: `${SiteTitleFontFamily}, ${FontHeading}`,
    fontSize: 48,
    fontWeight: 400,
    lineHeight: 1.5,
    color: '#000000',
    whiteSpace: 'nowrap',
    '& a': { color: 'inherit', textDecoration: 'none' },
    '&& a:hover': { textDecoration: 'none' },
    '& a:focus-visible': { outline: '2px solid currentColor', outlineOffset: 6, borderRadius: 2 },
  },
});
