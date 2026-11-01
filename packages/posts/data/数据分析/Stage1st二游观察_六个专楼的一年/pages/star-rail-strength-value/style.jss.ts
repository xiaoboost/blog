import { createStyles } from '@blog/styles/compile';

export default createStyles({
  chart: { display: 'block', flexShrink: 0, fontVariantNumeric: 'tabular-nums' },
  subtitle: { fontSize: 26, lineHeight: 1.6, paddingTop: 14 },
  legend: { fontSize: 25 },
  note: { fontSize: 23, opacity: 0.65 },
  conclusion: { fontSize: 27, lineHeight: 1.65, '& strong': { fontWeight: 600, fontVariantNumeric: 'tabular-nums' } },
});
