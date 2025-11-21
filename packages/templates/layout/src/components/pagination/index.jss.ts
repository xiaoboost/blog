import { createStyles, White, Shadow } from '@blog/styles';

export default createStyles({
  paginationAction: {
    padding: 10,
    backgroundColor: White.toString(),
    boxShadow: `0 1px 3px ${Shadow.toString()}`,
    borderRadius: '4px',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 10,
    width: '100%',
  },
});
