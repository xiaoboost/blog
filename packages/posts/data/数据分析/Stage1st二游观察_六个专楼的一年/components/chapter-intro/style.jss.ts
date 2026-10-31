import { createStyles, TextSecondary } from '@blog/styles/compile';

export default createStyles({
  content: {
    paddingBottom: 40,
    '& $title': { fontSize: 108, lineHeight: 1.25, letterSpacing: '-.025em', margin: '30px 0 44px' },
  },
  title: {},
  chapterLabel: { fontSize: 25, letterSpacing: '.16em', color: TextSecondary },
  description: { maxWidth: 1450, fontSize: 34, lineHeight: 1.9, color: TextSecondary },
});
