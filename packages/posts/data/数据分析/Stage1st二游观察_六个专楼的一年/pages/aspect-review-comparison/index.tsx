import { Bar, Chart, Group } from '@blog/mdx-chart';
import { Box, Eyebrow, Flex, PageLayout, Section } from '@blog/mdx-slide';
import { reviewData } from '../../components/aspect-reviews/data';
import { formatPercent, sentimentColors, sentimentKeys, sentimentLabels, topics } from '../../components/content-analysis/constants';
import styles from '../../components/content-analysis/style.jss';
import { PageTitle } from '../../components/page-title';
import { contentGap } from '../constants';
import { formatNumber, games } from '../data';
import sharedStyles from '../shared.jss';

const labelWidth = 240;
const columnWidth = (1720 - labelWidth) / games.length;
const rowHeight = 76;

export function AspectReviewComparison({ sentiment }: { sentiment: 'positive' | 'negative' }) {
  const label = sentimentLabels[sentiment];
  const title = sentiment === 'positive' ? '各个楼里，哪些方面得到的称赞最多？' : '各个楼里，哪些方面引起的抱怨最多？';
  return <Section title={`各方面评价 · ${label}`} className={sharedStyles.classes.page}>
    <PageLayout>
      <Flex direction="column" height="100%" gap={0}>
        <Box flex="fixed"><Eyebrow>大家在聊什么 · {label}评价</Eyebrow><PageTitle>{title}</PageTitle></Box>
        <Flex direction="column" flex="fill" justify="space-between" margin={`${contentGap}px 0 0`} gap={0}>
          <p className={styles.classes.note}>粗体为{label}评价条数，下方为该楼该方面的评价总数。底色越深，{label}占比越高。一帖可评价多个方面。</p>
          <Chart width={1720} height={750} className={styles.classes.chart} role="img" aria-label={`六个专楼各方面的${label}评价条数、评价总数及占比`}>
            {topics.map((topic, i) => <text key={topic} x={labelWidth - 20} y={50 + i * rowHeight + 44}
              textAnchor="end" fill="currentColor" fontSize={26}>{topic}</text>)}
            {games.map((game, j) => <Group key={game.id} left={labelWidth + j * columnWidth}>
              <Bar x={columnWidth / 2 - 22} width={44} height={4} fill={game.color} />
              <text x={columnWidth / 2} y={35} textAnchor="middle" fill="currentColor" fontSize={29}>{game.name}</text>
              {topics.map((topic, i) => {
                const row = reviewData[game.id].find(item => item.topic === topic)!;
                const total = sentimentKeys.reduce((sum, key) => sum + row[key], 0);
                const count = row[sentiment];
                const share = count / total;
                return <Group key={topic} top={50 + i * rowHeight}>
                  <Bar x={4} width={columnWidth - 8} height={rowHeight - 6} rx={3} fill={sentimentColors[sentiment]} fillOpacity={0.05 + 0.72 * share} />
                  <text x={columnWidth / 2 - 6} y={32} textAnchor="end" fill="currentColor" fontSize={31} fontWeight={600}>{formatNumber(count)}</text>
                  <text x={columnWidth / 2 + 10} y={31} fill="currentColor" fontSize={23}>{formatPercent(share)}</text>
                  <text x={columnWidth / 2} y={58} textAnchor="middle" fill="currentColor" opacity={0.75} fontSize={20}>共 {formatNumber(total)} 条</text>
                </Group>;
              })}
            </Group>)}
          </Chart>
        </Flex>
      </Flex>
    </PageLayout>
  </Section>;
}
