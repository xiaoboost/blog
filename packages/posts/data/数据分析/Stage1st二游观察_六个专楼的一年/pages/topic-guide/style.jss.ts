import { BorderPrimary, createStyles, TextSecondary } from '@blog/styles/compile';
import { accentColor } from '../constants';

export default createStyles({
  item: { borderTop: `1px solid ${BorderPrimary}`, paddingTop: 18, minWidth: 0 },
  heading: { color: accentColor, lineHeight: 1.35 },
  description: { fontSize: 27, lineHeight: 1.65 },
  examples: { fontSize: 22, lineHeight: 1.5, color: TextSecondary },
  footnote: {
    borderTop: `1px solid ${BorderPrimary}`, paddingTop: 18, fontSize: 22, lineHeight: 1.6, color: TextSecondary,
    '& strong': { fontWeight: 500, marginRight: 12 },
  },
});
