import { Box, Eyebrow, Flex, Section, PageLayout } from '@blog/mdx-slide';
import { PageTitle } from '../../components/page-title';
import sharedStyles from '../shared.jss';
import { topicGuide } from './data';
import styles from './style.jss';

const topicsPerRow = 3;
const topicRows = Array.from(
  { length: Math.ceil(topicGuide.length / topicsPerRow) },
  (_, index) => topicGuide.slice(index * topicsPerRow, (index + 1) * topicsPerRow),
);

export function TopicGuide() {
  return <Section title="这些话题分别指什么？" className={sharedStyles.classes.page}>
    <PageLayout>
      <Flex direction="column" height="100%" gap={0}>
        <Box flex="fixed"><Eyebrow>大家在聊什么</Eyebrow><PageTitle>这些话题分别指什么？</PageTitle></Box>
        <Flex direction="column" justify="space-between" gap={24} flex="fill" margin="32px 0 0">
          {topicRows.map(row => <Flex key={row[0].topic} gap={64} flex="fixed">
            {row.map(item => <Flex key={item.topic} direction="column" gap={12} flex={1} className={styles.classes.item} data-topic-guide={item.topic}>
              <h3 className={styles.classes.heading}>{item.topic}</h3>
              <p className={styles.classes.description}>{item.description[0]}<br />{item.description[1]}</p>
              <p className={styles.classes.examples}>{item.examples}</p>
            </Flex>)}
          </Flex>)}
        </Flex>
        <Flex justify="space-between" gap={48} flex="fixed" margin="20px 0 0" className={styles.classes.footnote}>
          <p><strong>不明</strong>缺图、简称或指代不足，无法识别话题。</p>
          <p><strong>未标话题</strong>当前分类结果没有给出话题标签。</p>
        </Flex>
      </Flex>
    </PageLayout>
  </Section>;
}
