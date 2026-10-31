import { createStyles } from '@blog/styles/compile';

export default createStyles({
  chart: { display: 'block', flexShrink: 0, fontVariantNumeric: 'tabular-nums' },
  legend: { fontSize: 25 },
  swatch: { display: 'block', flexShrink: 0 },
  summary: { fontSize: 27, lineHeight: 1.65, '& strong': { fontWeight: 600, fontVariantNumeric: 'tabular-nums' } },
});
