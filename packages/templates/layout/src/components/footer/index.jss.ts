import {
  createStyles,
  TextTertiary,
  FontBody,
  TextPrimary,
  createMediaStylesByTemplate,
} from '@blog/styles/compile';
import { AccentDanger } from '../../styles/theme/token';

export default createStyles({
  mainFooter: {
    flex: '0 auto',
    fontFamily: FontBody,
    fontWeight: 'normal',
    width: '100%',
    color: TextTertiary,
    textAlign: 'center',
    fontSize: 12,

    ...createMediaStylesByTemplate(
      (width) => ({
        padding: `${width}px 0 18px 0`,
      }),
      {
        pc: 40,
        phone: 24,
      },
    ),
  },
  mainFooterHref: {
    color: TextPrimary,
    transition: 'color .2s ease-out',

    '&:hover': {
      color: AccentDanger,
      cursor: 'pointer',
    },
  },
});
