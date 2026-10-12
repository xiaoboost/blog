import { createStyles } from '@blog/styles/compile';

export default createStyles({
  page: {
    color: '#f4f5ec',
    '& p': { color: 'inherit' },
  },
  caption: { fontSize: 27, lineHeight: 1.8, opacity: 0.8, marginTop: '30px !important' },
  annotation: {
    color: '#243e42',
    background: '#edf0da',
    transform: 'rotate(6deg)',
    boxShadow: '0 18px 60px rgba(0,0,0,.16)',
  },
});
