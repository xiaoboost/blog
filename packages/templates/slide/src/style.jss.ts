import { createStyles } from '@blog/styles/compile';

export default createStyles({
  page: {
    // 覆盖站点正文容器的固定宽度，保留共用的页眉与页脚。
    '&&': {
      width: '100%',
      marginTop: 0,
      alignItems: 'center',
      justifyContent: 'center',
      padding: [24, 0],
    },
  },
});
