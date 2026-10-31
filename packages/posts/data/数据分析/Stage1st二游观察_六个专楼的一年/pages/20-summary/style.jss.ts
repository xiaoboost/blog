import { BorderPrimary, createStyles, TextSecondary } from '@blog/styles/compile';
import { accentColor } from '../constants';

export default createStyles({
  totals: { fontSize: 26, lineHeight: 1.5, color: TextSecondary, fontVariantNumeric: 'tabular-nums', paddingBottom: 5 },
  scope: {
    borderLeft: `4px solid ${accentColor}`, paddingLeft: 22, fontSize: 26, lineHeight: 1.7, color: TextSecondary,
    '& strong': { color: accentColor, fontWeight: 500 },
  },
  observation: { borderTop: `1px solid ${BorderPrimary}`, paddingTop: 20 },
  title: { lineHeight: 1.5, fontWeight: 500, color: accentColor },
  lead: { fontSize: 27, lineHeight: 1.6, fontVariantNumeric: 'tabular-nums' },
  detail: { fontSize: 25, lineHeight: 1.65, color: TextSecondary },
  keepTogether: { whiteSpace: 'nowrap' },
});
