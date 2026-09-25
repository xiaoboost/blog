import {
  createStyles, BgSecondary, BorderPrimary, ShadowCard, RadiusMd,
  TextPrimary, TextTertiary, AccentPrimary, FontBody, FontHeading,
} from '@blog/styles/compile';
import {
  ArchiveYearFontFamily, ArchiveYearFontWeight,
  ListTitleFontFamily, ListTitleFontWeight,
  ListItemTitleFontFamily, ListItemTitleFontWeight,
} from '../../constant/font';

export default createStyles({
  archiveBody: {
    '&&': { alignItems: 'stretch', fontFamily: FontBody },
    '& a:focus-visible': { outline: `2px solid ${AccentPrimary}`, outlineOffset: 3, borderRadius: 2 },
  },
  heading: {
    display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 20, margin: [
      0, 8, 22,
    ],
    '& h1': { margin: 0, fontFamily: `${ListTitleFontFamily}, ${FontHeading}`, fontWeight: ListTitleFontWeight, fontSize: 28, lineHeight: 1.45, color: TextPrimary, '@media (max-width: 640px)': { fontSize: 24 } },
    '@media (max-width: 640px)': { margin: [
      0, 18, 18,
    ], gap: 12 },
  },
  range: { color: TextTertiary, fontSize: 12, fontVariantNumeric: 'tabular-nums', letterSpacing: '.08em', whiteSpace: 'nowrap', '@media (max-width: 640px)': { fontSize: 11 } },
  paper: { padding: [8, 38], borderRadius: RadiusMd, backgroundColor: BgSecondary, boxShadow: ShadowCard, '@media (max-width: 640px)': { padding: [8, 22] } },
  yearGroup: {
    display: 'grid', gridTemplateColumns: '90px minmax(0, 1fr)', columnGap: 22, marginBottom: 26,
    '&:last-child': { marginBottom: 0, '& $row:last-child': { borderBottom: 'none' } },
    '@media (max-width: 640px)': { gridTemplateColumns: '1fr', gap: 2, marginBottom: 25 },
  },
  yearLabel: {
    // 补偿 Lora 数字与思源宋体标题的字面位置差，让首行视觉中线对齐。
    paddingTop: 12,
    '& h2': {
      display: 'flex', alignItems: 'baseline', gap: 8, margin: 0, color: TextPrimary,
      fontFamily: `${ArchiveYearFontFamily}, ${FontHeading}`, fontWeight: ArchiveYearFontWeight,
      fontSize: 25, lineHeight: 1.4, fontVariantNumeric: 'tabular-nums',
      '@media (max-width: 640px)': { fontSize: 23 },
    },
    '@media (max-width: 640px)': { display: 'flex', alignItems: 'baseline', gap: 14, paddingTop: 0, marginBottom: 1 },
  },
  continued: { color: TextTertiary, fontFamily: FontBody, fontWeight: 400, fontSize: 11, lineHeight: 1.5 },
  yearCount: { display: 'block', marginTop: 5, color: TextTertiary, fontSize: 11, lineHeight: 1.6, whiteSpace: 'nowrap', '@media (max-width: 640px)': { marginTop: 0 } },
  entries: { listStyle: 'none', margin: 0, padding: 0 },
  row: {
    display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 22, margin: 0,
    padding: [13, 0], borderBottom: `1px solid ${BorderPrimary}`,
    '& a': {
      minWidth: 0, color: TextPrimary, fontFamily: `${ListItemTitleFontFamily}, ${FontHeading}`,
      fontWeight: ListItemTitleFontWeight, fontSize: 17, lineHeight: 1.65, textDecoration: 'none', overflowWrap: 'anywhere',
      '&:hover': { color: AccentPrimary },
      '@media (max-width: 640px)': { fontSize: 16 },
    },
    '& time': { flexShrink: 0, color: TextTertiary, fontFamily: FontBody, fontWeight: 400, fontSize: 12, lineHeight: 1.5, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', '@media (max-width: 640px)': { fontSize: 11 } },
    '@media (max-width: 640px)': { gap: 14, padding: [12, 0] },
  },
});
