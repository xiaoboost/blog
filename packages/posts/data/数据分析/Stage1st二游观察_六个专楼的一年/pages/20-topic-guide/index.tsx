import { Box, TitleLabel, Flex, Grid, Section } from '@blog/mdx-slide';
import { pagePadding } from '../constants';
import { PageTitle } from '../../components/page-title';
import sharedStyles from '../shared.jss';
import { topicGuide } from './data';
import styles from './style.jss';

export function TopicGuide() {
  return <Section title="这些话题分别指什么？" className={sharedStyles.classes.page}>
    <Flex direction="column" height="100%" padding={pagePadding} gap={0}>
      <Box flex="fixed"><TitleLabel>大家在聊什么</TitleLabel><PageTitle>这些话题分别指什么？</PageTitle></Box>
      <Grid columns={3} rows={3} columnGap={64} rowGap={24} flex="fill" margin="32px 0 0">
        {topicGuide.map(item => <Flex key={item.topic} direction="column" gap={12} className={styles.classes.item} data-topic-guide={item.topic}>
          <h3 className={styles.classes.heading}>{item.topic}</h3>
          <p className={styles.classes.description}>{item.description[0]}<br />{item.description[1]}</p>
          <p className={styles.classes.examples}>{item.examples}</p>
        </Flex>)}
      </Grid>
      <Flex justify="space-between" gap={48} flex="fixed" margin="20px 0 0" className={styles.classes.footnote}>
        <p><strong>不明</strong>缺图、简称或指代不足，无法识别话题。</p>
        <p><strong>未标话题</strong>当前分类结果没有给出话题标签。</p>
      </Flex>
    </Flex>
  </Section>;
}
