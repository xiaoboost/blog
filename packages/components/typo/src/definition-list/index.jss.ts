import {
  createStyles,
  FontBody,
  FontSizeSm,
  FontSizeRegular,
  FontSizeMd,
  TextPrimary,
  TextSecondary,
  TextTertiary,
  BorderPrimary,
} from '@blog/styles/compile';

export default createStyles({
  definition: {},
  term: {},
  alias: {},
  description: {},
  definitions: {
    // 提升组件内样式优先级，避免文章段落的缩进、行高和段距渗入。
    '&&': {
      margin: '0 0 20px',
      padding: 0,
      fontFamily: FontBody,
      fontSize: `calc(${FontSizeMd} - 1px)`,
      lineHeight: 1.6,
      textIndent: 0,

      '& $definition': {
        display: 'flex',
        flexWrap: 'wrap',
        columnGap: 18,
        rowGap: 3,
        padding: '9px 0 10px',
        borderBottom: `1px solid ${BorderPrimary}`,

        '&:first-child': {
          paddingTop: 4,
        },
      },
      '& $term': {
        flex: '0 0 18%',
        minWidth: 96,
        maxWidth: '100%',
        margin: 0,
        fontWeight: 'bold',
        color: TextPrimary,
        overflowWrap: 'anywhere',
      },
      '& $alias': {
        display: 'block',
        marginTop: 1,
        fontSize: FontSizeSm,
        fontWeight: 'normal',
        lineHeight: 1.6,
        color: TextTertiary,
      },
      '& $description': {
        flex: '1 1 0',
        // 96px 名称 + 18px 间距 + 366px 解释：容器不足 480px 时自动换行。
        minWidth: 'min(100%, 366px)',
        margin: 0,
        color: TextSecondary,
        overflowWrap: 'anywhere',

        '& > p': {
          margin: 0,
          textIndent: 0,
          lineHeight: 'inherit',
        },
        '& > p + p': {
          marginTop: 4,
        },
      },

      '@media (max-width: 600px)': {
        fontSize: FontSizeRegular,

        '& $definition': {
          padding: '10px 0',

          '&:first-child': {
            paddingTop: 4,
          },
        },
        '& $term': {
          flexBasis: '100%',
          minWidth: 0,
        },
        '& $alias': {
          display: 'inline',
          marginLeft: 10,
          marginTop: 0,
        },
      },
    },
  },
});
