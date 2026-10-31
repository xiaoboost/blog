import { createStyles, TextPrimary, TextSecondary, BorderPrimary } from '@blog/styles/compile';
import { accentColor } from '../constants';

export default createStyles({
  reason: { '& p': { fontSize: 27, lineHeight: 1.85, color: TextSecondary } },
  methodHeading: { paddingBottom: 18, borderBottom: `2px solid ${BorderPrimary}`, color: accentColor },
  methodItem: { '& h4': { fontSize: 28, fontWeight: 500, margin: 0 }, '& p': { fontSize: 26, lineHeight: 1.75, color: TextSecondary } },
  threadLinks: { fontSize: 26, lineHeight: 1.75, '& a': { color: TextPrimary, '&:hover': { color: accentColor } } },
  methodNote: { fontSize: 23, color: TextSecondary },
});
