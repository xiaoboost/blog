import {
  createStyles,
  TextSecondary,
  TextTertiary,
  BorderPrimary,
  RadiusSm,
  DurationFast,
} from '@blog/styles/compile';

export default createStyles({
  glossContent: {},
  glossDescription: {},
  glossDescriptionText: {},
  glossReveal: {},
  glossClip: {},
  glossMeasure: {},
  glossAnimating: {},
  glossActive: {},
  glossClosing: {},
  glossSeparator: {},
  glossWrapper: {
    position: 'relative',

    '& $glossContent': {
      display: 'inline',
      cursor: 'pointer',
      position: 'relative',
      padding: [2, 0],
      color: 'inherit',
      font: 'inherit',
      lineHeight: 'inherit',
      textAlign: 'inherit',
      backgroundColor: 'transparent',
      backgroundImage: `linear-gradient(to right, ${TextTertiary} 4px, transparent 4px)`,
      backgroundSize: '7px 1px',
      backgroundPosition: 'left bottom',
      backgroundRepeat: 'repeat-x',
      transition: `background-size ${DurationFast} ease-in-out, background-color ${DurationFast} ease-in-out, padding ${DurationFast} ease-in-out`,
      boxDecorationBreak: 'clone',
      webkitBoxDecorationBreak: 'clone',

      '&:hover, &:focus-visible': {
        backgroundSize: '4px 1px',
      },
      '&:focus-visible': {
        outline: `2px solid ${TextTertiary}`,
        outlineOffset: 2,
        borderRadius: RadiusSm,
      },
    },
    '& $glossDescription': {
      // 收起时连边距和分隔线一起退出排版。
      display: 'none',
      textIndent: 0,
      whiteSpace: 'normal',
      overflowWrap: 'anywhere',
      fontSize: '90%',
      color: TextSecondary,
    },
    '& $glossMeasure': {
      position: 'fixed',
      visibility: 'hidden',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      textIndent: 0,
      width: 'max-content',
    },
    '&$glossActive': {
      '& $glossContent': {
        backgroundColor: BorderPrimary,
        backgroundSize: '4px 0px',
        borderRadius: RadiusSm,
        padding: [2, 4],
      },
    },
    '&$glossActive, &$glossClosing': {
      '& $glossDescription': {
        display: 'inline',
        marginLeft: '0.5em',
      },
    },
    '&$glossAnimating': {
      '& $glossDescriptionText': {
        // 原文仍供辅助技术读取，动画副本只负责可见部分的排版。
        position: 'absolute',
        width: 1,
        height: 1,
        overflow: 'hidden',
        clipPath: 'inset(50%)',
        whiteSpace: 'nowrap',
      },
    },
    '& $glossReveal': {
      pointerEvents: 'none',
    },
    '& $glossClip': {
      display: 'inline-block',
      whiteSpace: 'nowrap',
      // overflow:hidden 会改变行内块的基线，改为只裁掉字形右侧。
      clipPath: 'inset(-0.3em 0 -0.3em 0)',
    },
    '&$glossActive$glossSeparator, &$glossClosing$glossSeparator': {
      '& $glossDescription': {
        paddingRight: 10,
        marginRight: 8,
        borderRight: `1px solid ${TextTertiary}`,
      },
    },
    '@media (prefers-reduced-motion: reduce)': {
      '& $glossContent': {
        transition: 'none',
      },
    },
  },
});
