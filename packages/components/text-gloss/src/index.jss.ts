import { createStyles, BlackLight, BlackLighter, Gray } from '@blog/styles';

const duration = '0.2s';
const durationGloss = '0.5s';

export default createStyles({
  glossContent: {},
  glossDescription: {},
  glossActive: {},
  glossSeparator: {},
  glossWrapper: {
    position: 'relative',
    margin: [0, 2],

    '& $glossContent': {
      display: 'inline',
      cursor: 'pointer',
      position: 'relative',
      padding: [2, 0],
      transition: `padding ${duration} ease-in-out, background-color ${duration} ease-in-out`,
      backgroundImage: `repeating-linear-gradient(
        to right,
        /* 实线部分从 0px 开始 */
        ${BlackLighter.toString()} 0,
        /* 实线部分到 4px 结束 */
        ${BlackLighter.toString()} 4px,
        /* 透明部分从 4px 开始 */
        transparent 4px,
        /* 透明部分到 7px 结束 */
        transparent 7px
      )`,
      backgroundSize: [7, 1],
      backgroundRepeat: 'repeat-x',
      backgroundPosition: [0, 19],

      '&:hover': {
        backgroundSize: [4, 1],
        backgroundRepeat: 'repeat-x',
        backgroundPosition: [0, 19],
        backgroundImage: `repeating-linear-gradient(
          to right,
          /* 实线部分从 0px 开始 */
          ${BlackLighter.toString()} 0,
          /* 实线部分到 4px 结束 */
          ${BlackLighter.toString()} 4px
        )`,
      },
    },
    '& $glossDescription': {
      display: 'inline-block',
      whiteSpace: 'nowrap',
      maxWidth: 0,
      opacity: 0,
      textIndent: 0,
      overflow: 'hidden',
      verticalAlign: 'bottom',
      transition: `all ${durationGloss} ease`,
      fontSize: '90%',
      color: BlackLight.toString(),
    },
    '&$glossActive': {
      '& $glossContent': {
        backgroundColor: `${Gray.toString()} !important`,
        backgroundImage: 'none !important',
        borderRadius: 2,
        padding: [2, 4],
      },
      '& $glossDescription': {
        maxWidth: 500,
        opacity: 0.9,
        marginLeft: 8,
      },
    },
    '&$glossSeparator': {
      '& $glossDescription': {
        paddingRight: 10,
        marginRight: 8,
        borderRight: `1px solid ${BlackLighter.toString()}`,
      },
    },
  },
});
