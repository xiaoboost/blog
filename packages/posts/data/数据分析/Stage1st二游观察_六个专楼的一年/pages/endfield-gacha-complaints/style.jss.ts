import { createStyles } from '@blog/styles/compile';
import { sentimentColors } from '../../components/content-analysis/constants';

export default createStyles({
  chart: { display: 'block', flexShrink: 0, fontVariantNumeric: 'tabular-nums' },
  subtitle: { fontSize: 26, lineHeight: 1.6, paddingTop: 14 },
  quote: { borderLeft: `4px solid ${sentimentColors.negative}`, paddingLeft: 24 },
  source: { fontSize: 21, lineHeight: 1.5, opacity: 0.65, paddingBottom: 12 },
  excerpt: { fontSize: 27, lineHeight: 1.75 },
});
