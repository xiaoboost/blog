import { createStyles, BgSecondary, RadiusMd, TextPrimary, TextTertiary, AccentPrimary, FontBody } from '@blog/styles/compile';
import { PaginationShadow } from '../../styles/theme/token';

export default createStyles({
  paginationAction: {
    padding: 10,
    backgroundColor: BgSecondary,
    boxShadow: PaginationShadow,
    borderRadius: RadiusMd,
  },
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    width: '100%',
    '& a:focus-visible': { outline: `2px solid ${AccentPrimary}`, outlineOffset: 3 },
    '@media (max-width: 640px)': { gap: 8 },
  },
  newer: { display: 'flex', flex: 1 },
  older: { display: 'flex', flex: 1, justifyContent: 'flex-end' },
  pageNumbers: { display: 'flex', alignItems: 'center', gap: 6 },
  pageNumber: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    minWidth: 28, height: 28, padding: [0, 5], borderBottom: '1px solid transparent',
    color: TextTertiary, fontFamily: FontBody, fontSize: 12, lineHeight: 1,
    '&:hover': { color: AccentPrimary },
    '&[aria-current="page"]': { borderBottomColor: TextPrimary, color: TextPrimary },
    '@media (max-width: 640px)': { display: 'none' },
  },
  pageCount: {
    display: 'none', alignItems: 'center', height: 28, color: TextTertiary,
    fontFamily: FontBody, fontSize: 12, lineHeight: 1, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
    '@media (max-width: 640px)': { display: 'inline-flex' },
  },
});
