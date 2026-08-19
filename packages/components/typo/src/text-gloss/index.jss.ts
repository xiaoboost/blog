import {
  createStyles,
  TextSecondary,
  TextTertiary,
  BorderPrimary,
  RadiusSm,
  DurationFast,
  DurationNormal,
} from '@blog/styles/compile';

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
      appearance: 'none',
      border: 0,
      margin: 0,
      cursor: 'pointer',
      position: 'relative',
      padding: [2, 0],
      color: 'inherit',
      font: 'inherit',
      lineHeight: 'inherit',
      textAlign: 'inherit',
      backgroundColor: 'transparent',
      transition: `padding ${DurationFast} ease-in-out, background-color ${DurationFast} ease-in-out`,
      backgroundImage: `repeating-linear-gradient(
        to right,
        /* 实线部分从 0px 开始 */
        ${TextTertiary} 0,
        /* 实线部分到 4px 结束 */
        ${TextTertiary} 4px,
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
          ${TextTertiary} 0,
          /* 实线部分到 4px 结束 */
          ${TextTertiary} 4px
        )`,
      },
      '&:focus-visible': {
        outline: `2px solid ${TextTertiary}`,
        outlineOffset: 2,
        borderRadius: RadiusSm,
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
      transition: `all ${DurationNormal} ease`,
      fontSize: '90%',
      color: TextSecondary,
    },
    '&$glossActive': {
      '& $glossContent': {
        backgroundColor: `${BorderPrimary} !important`,
        backgroundImage: 'none !important',
        borderRadius: RadiusSm,
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
        borderRight: `1px solid ${TextTertiary}`,
      },
    },
  },
});
