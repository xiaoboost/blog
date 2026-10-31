import { createStyles, FontBody, TextPrimary, TextSecondary } from '@blog/styles/compile';

export default createStyles({
  '@global': {
    'article[aria-label="Stage1st 二游观察：六个专楼的一年"] [aria-live="polite"], article[aria-label="Stage1st 二游观察：六个专楼的一年"] [aria-live="polite"] + span[aria-hidden="true"]': { display: 'none' },
  },
  page: {
    fontFamily: FontBody, color: TextPrimary, lineHeight: 1.6,
    '& h1, & h2, & h3, & p': { margin: 0 },
    '& h2': { fontSize: 62, lineHeight: 1.3 },
    '& h3, & h4, & h5, & h6': { fontFamily: FontBody, fontWeight: 500 },
    '& h3': { fontSize: 32 },
    '& a': { color: 'inherit', textDecoration: 'none', '&:hover': { textDecoration: 'none' } },
  },
  eyebrow: { fontSize: 24, letterSpacing: '.12em', color: TextSecondary, marginBottom: '20px !important' },
});
