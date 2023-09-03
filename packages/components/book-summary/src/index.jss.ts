import { createStyles, Black, BlackExtraLight, White, BlackLighter } from '@blog/styles';

export default createStyles({
  bookPopover: {
    display: 'flex',
    padding: 10,
    borderRadius: 4,
    border: `1px solid ${BlackExtraLight.toString()}`,
    backgroundColor: White.toString(),
  },
  bookCoverBox: {
    display: 'flex',

    '& img': {
      width: 150,
      height: 200,
    },
  },
  bookDescription: {
    paddingLeft: 14,
    width: 380,
    height: 200,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    overflowY: 'hidden',
  },
  bookTitle: {
    color: Black.toString(),
    fontSize: 32,
    fontWeight: 600,
    height: 36,
    lineHeight: '36px',
    margin: 0,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  bookAuthorBox: {
    color: Black.toString(),
    display: 'flex',
    fontSize: 14,
    fontWeight: 600,
    lineHeight: '22px',
    margin: '10px 0',
  },
  bookAuthor: {
    color: Black.toString(),
  },
  bookAuthorIcon: {
    marginLeft: 8,
  },
  bookIntro: {
    color: BlackLighter.toString(),
    fontSize: 14,
    fontWeight: 400,
    // 刚好六行
    height: 120,
    lineHeight: '20px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'pre-wrap',
    margin: 0,
    padding: 0,
  },
});
