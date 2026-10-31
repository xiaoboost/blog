import { BgPrimary, createStyles, TextSecondary } from '@blog/styles/compile';

export default createStyles({
  chart: { display: 'block', flexShrink: 0, fontVariantNumeric: 'tabular-nums' },
  caption: { fontSize: 23, color: TextSecondary },
  legend: { fontSize: 23, whiteSpace: 'nowrap' },
  note: { whiteSpace: 'nowrap' },
  annotation: { stroke: BgPrimary, strokeWidth: 6, paintOrder: 'stroke', strokeLinejoin: 'round' },
});
