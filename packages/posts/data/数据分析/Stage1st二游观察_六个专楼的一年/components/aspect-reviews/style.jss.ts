import { createStyles } from '@blog/styles/compile';

export default createStyles({
  chart: { display: 'block', flexShrink: 0, fontVariantNumeric: 'tabular-nums' },
  legend: { fontSize: 24, lineHeight: 1.4 },
  legendDescription: { fontSize: 20, opacity: 0.65, marginLeft: 10 },
  note: { fontSize: 22, opacity: 0.65 },
  gameName: { lineHeight: 1.3, borderLeft: '5px solid', paddingLeft: 14 },
});
