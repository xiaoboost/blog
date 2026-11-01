import { Box, Flex } from '@blog/mdx-slide';
import { ChapterIntro } from '../../components/chapter-intro';
import { accentColor } from '../constants';
import styles from './style.jss';

export function Afterword() {
  const c = styles.classes;
  return (
    <ChapterIntro
      label="谢谢你看到这里"
      title="写在最后"
      paragraphs={[
        '第一次做数据分析，大肥鱼帮忙采集、整理和画图，我负责选题、取舍和讲述。',
        '这次更多还只是把数据摊开，走马观花地看了一遍，很多地方还不成熟。以后有空再挑些有意思的现象，到时候再和大家聊聊吧~',
      ]}
    >
    </ChapterIntro>
  );
}
