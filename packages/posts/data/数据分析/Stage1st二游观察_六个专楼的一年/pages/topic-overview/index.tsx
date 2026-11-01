import { Box, Eyebrow, Flex, Section, PageLayout } from '@blog/mdx-slide';
import { accentColor, contentGap } from '../constants';
import { PageTitle } from '../../components/page-title';
import { TopicMatrix } from '../../components/content-analysis';
import { topics } from '../../components/content-analysis/constants';
import contentStyles from '../../components/content-analysis/style.jss';
import sharedStyles from '../shared.jss';
import { topicColumns } from './data';

export function TopicOverview() {
  return <Section title="六个楼，主要在聊什么？" className={sharedStyles.classes.page}>
    <PageLayout>
      <Flex direction="column" height="100%" gap={0}>
        <Box flex="fixed"><Eyebrow>大家在聊什么</Eyebrow><PageTitle>六个楼，主要在聊什么？</PageTitle></Box>
        <Flex direction="column" flex="fill" justify="space-between" margin={`${contentGap}px 0 0`} gap={0}>
          <p className={contentStyles.classes.note}>占各楼可分析帖子的比例；一帖可涉及多个话题</p>
          <TopicMatrix label="六个专楼的话题占比" rows={[...topics, '不明', '未标话题']} columns={topicColumns}
            height={746} color={accentColor} maximum={0.5} mutedFrom={9} />
        </Flex>
      </Flex>
    </PageLayout>
  </Section>;
}
