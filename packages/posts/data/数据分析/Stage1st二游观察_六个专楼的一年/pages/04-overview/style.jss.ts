import { createStyles, TextSecondary } from '@blog/styles/compile';

export default createStyles({
  dot: { display: 'inline-block', marginRight: 16, flexShrink: 0 },
  chartCaption: { fontSize: 23, color: TextSecondary, marginTop: '5px !important', marginBottom: '12px !important' },
  legend: { listStyle: 'none', padding: 0, margin: 0, fontSize: 26, '& strong': { fontSize: 27, fontWeight: 500, fontVariantNumeric: 'tabular-nums' } },
  legendCount: { textAlign: 'right', whiteSpace: 'nowrap' },
  legendShare: { textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', color: TextSecondary },
  chartFootnote: { fontSize: 23, color: TextSecondary, marginTop: '12px !important' },
});
