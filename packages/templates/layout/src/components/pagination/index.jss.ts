import { createStyles, BgSecondary } from '@blog/styles';
import { PaginationShadow } from '../../styles/theme';

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
