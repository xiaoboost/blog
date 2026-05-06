import { createStyles, BgSecondary, RadiusMd } from '@blog/styles/compile';
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
    marginTop: 10,
    width: '100%',
  },
});
