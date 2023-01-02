import {
  createStyles,
  BlackLighter,
  FontDefault,
  createMediaStyles,
  Black,
  RedLight,
} from '@blog/styles';

export default createStyles({
  mainFooter: {
    flex: '0 auto',
    fontFamily: FontDefault,
    fontWeight: 'normal',
    width: '100%',
    color: BlackLighter.toString(),
    textAlign: 'center',
    fontSize: 12,

    ...createMediaStyles(40, 24, (width) => ({
      padding: `${width}px 0 18px 0`,
    })),
  },
  mainFooterHref: {
    color: Black.toString(),
    transition: 'color .2s ease-out',

    '&:hover': {
      color: RedLight.toString(),
      cursor: 'pointer',
    },
  },
});
