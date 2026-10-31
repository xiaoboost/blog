import { createStyles, FontHeading, TextSecondary } from '@blog/styles/compile';
import { accentColor } from '../constants';

export default createStyles({
  introCopy: {
    textAlign: 'center',
    '& $eyebrow': { marginBottom: '36px !important' },
    '& h1': { fontFamily: FontHeading, fontSize: 124, fontWeight: 600, lineHeight: 1.2, letterSpacing: '-.035em' },
    '&::before': { content: '""', display: 'block', width: 76, height: 4, background: accentColor, margin: '0 auto 42px' },
  },
  eyebrow: {},
  accent: { color: accentColor },
  lead: { fontSize: 33, lineHeight: 1.9, color: TextSecondary, marginTop: '40px !important' },
});
