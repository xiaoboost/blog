import { createStyles, TextPrimary, TextSecondary, TextTertiary, BorderPrimary, BgPrimary, FontBody, FontHeading, PrimaryTitleFont } from '@blog/styles/compile';

export default createStyles({
  page: {
    fontFamily: FontBody,
    fontSize: 31.5,
    lineHeight: 1.65,
    color: TextPrimary,
    '& h1, & h2, & h3, & p': { margin: 0 },
    '& h1': { fontFamily: `${PrimaryTitleFont.fontFamily},${FontHeading}`, fontSize: 117, fontWeight: PrimaryTitleFont.fontWeight, lineHeight: 1.25, letterSpacing: '-.04em' },
    '& h2': { fontSize: 66, fontWeight: 500, lineHeight: 1.3 },
    '& h3': { fontSize: 36, fontWeight: 500 },
  },
  titleLabel: { fontSize: 21, letterSpacing: '.18em', color: TextTertiary },
  subtitle: { color: TextSecondary, fontSize: 33, marginTop: '36px !important' },
  note: { color: TextSecondary, fontSize: 25.5 },
  panel: { background: BgPrimary, border: `1.5px solid ${BorderPrimary}`, borderRadius: 18, padding: 39 },
  number: { fontSize: 82.5, lineHeight: 1, color: TextTertiary, marginBottom: '36px !important' },
  rule: { width: 90, height: 2.25, background: BorderPrimary, margin: '36px auto' },
});
