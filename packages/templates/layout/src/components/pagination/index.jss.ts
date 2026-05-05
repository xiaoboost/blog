import { createStyles, BgSecondary } from '@blog/styles/compile';
import { PaginationShadow } from '../../styles/theme/token';

export default createStyles({
  paginationAction: {
    padding: 10,
    backgroundColor: BgSecondary,
    boxShadow: PaginationShadow,
    borderRadius: '4px',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 10,
    width: '100%',
  },
});
