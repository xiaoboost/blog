import { createStyles } from '@blog/styles/compile';
import { accentColor } from '../constants';

export default createStyles({
  summary: { height: 100 },
  observations: { fontSize: 22, lineHeight: 1.5, '& strong': { fontWeight: 600 } },
  chartNote: { fontSize: 24, lineHeight: 1.6 },
  share: { color: accentColor, fontSize: 36, fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
  chart: { display: 'block', fontVariantNumeric: 'tabular-nums' },
});
