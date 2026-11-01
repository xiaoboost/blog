import { createStyles } from '@blog/styles/compile';

export default createStyles({
  chart: { display: 'block', flexShrink: 0, fontVariantNumeric: 'tabular-nums' },
  legendRow: { minHeight: 60 },
  legend: { fontSize: 24, lineHeight: 1.4 },
  legendDescription: { fontSize: 20, opacity: 0.65, marginLeft: 10 },
  note: { fontSize: 20, lineHeight: 1.5, opacity: 0.65, textAlign: 'right', flexShrink: 0 },
  pooledNote: { display: 'block', fontSize: 19 },
  chartTitle: { fontSize: 28, lineHeight: 1.3 },
});
