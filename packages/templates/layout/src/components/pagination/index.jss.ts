import { createStyles, BgPrimary, ShadowControl } from '@blog/styles';

export default createStyles({
  paginationAction: {
    padding: 10,
    backgroundColor: BgPrimary,
    boxShadow: ShadowControl,
    borderRadius: '4px',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 10,
    width: '100%',
  },
});
