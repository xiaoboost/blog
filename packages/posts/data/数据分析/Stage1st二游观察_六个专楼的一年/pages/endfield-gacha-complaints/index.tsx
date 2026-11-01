import { Bar, Chart, GridColumns, Group, scaleLinear } from '@blog/mdx-chart';
import { Box, Eyebrow, Flex, PageLayout, Section } from '@blog/mdx-slide';
import { sentimentColors } from '../../components/content-analysis/constants';
import { PageTitle } from '../../components/page-title';
import { contentGap } from '../constants';
import { formatNumber } from '../data';
import sharedStyles from '../shared.jss';
import { categories, denominator, quotes, unclassified } from './data';
import styles from './style.jss';

function ComplaintChart() {
  const plotWidth = 760;
  const maximum = Math.max(0.1, Math.ceil((categories[0].count / denominator) * 10) / 10);
  const x = scaleLinear({ domain: [0, maximum], range: [0, plotWidth] });
  const ticks = Array.from({ length: Math.round(maximum * 10) + 1 }, (_, index) => index / 10);
  return <Chart width={1080} height={720} className={styles.classes.chart} role="img" aria-label="终末地抽卡负面评价的六类具体意见">
    <title>{`分母为全部 ${denominator} 条入选抽卡负面评价，含未分出细类的 ${unclassified} 条。一帖可涉及多个问题，按各类数量降序排列。`}</title>
    {ticks.map(tick => <text key={tick} x={174 + x(tick)} y={28} textAnchor="middle" fill="currentColor" opacity={0.65} fontSize={22}>{Math.round(tick * 100)}%</text>)}
    <Group left={174} top={52}>
      <GridColumns scale={x} tickValues={ticks} height={624} stroke="currentColor" strokeOpacity={0.08} />
      {categories.map((row, index) => <Group key={row.name} top={index * 104 + 24}
        data-gacha-category={row.name} data-count={row.count} data-denominator={denominator} data-share={row.count / denominator}>
        <text x={-18} y={32} textAnchor="end" fill="currentColor" fontSize={27}>{row.name}</text>
        <Bar width={x(row.count / denominator)} height={48} rx={2} fill={sentimentColors.negative} />
        <text x={x(row.count / denominator) + 15} y={32} fill="currentColor" fontSize={25} data-gacha-value>
          {formatNumber(row.count)} 条<tspan fill={sentimentColors.negative}>（{(row.count / denominator * 100).toFixed(1)}%）</tspan>
        </text>
        <title>{`${row.name}：${row.description}。${row.count} / ${denominator} 条（${(row.count / denominator * 100).toFixed(1)}%）。`}</title>
      </Group>)}
    </Group>
  </Chart>;
}

export function EndfieldGachaComplaints() {
  return <Section title="终末地的抽卡，大家在抱怨什么？" className={sharedStyles.classes.page}>
    <PageLayout>
      <Flex direction="column" height="100%" gap={0}>
        <Box flex="fixed">
          <Eyebrow>大家在聊什么 · 终末地</Eyebrow>
          <PageTitle>终末地的抽卡，大家在抱怨什么？</PageTitle>
          <p className={styles.classes.subtitle}>六个专楼中，终末地在“抽卡体验与福利”上的负面评价数量和占比都最高，共 {formatNumber(denominator)} 条。</p>
        </Box>
        <Flex flex="fill" justify="space-between" align="center" gap={60} margin={`${contentGap}px 0 0`}>
          <Box width={1080} flex="fixed">
            <ComplaintChart />
          </Box>
          <Flex direction="column" width={580} height={720} justify="center" gap={100} flex="fixed" data-gacha-quotes>
            {quotes.map(quote => <div key={quote.pid} className={styles.classes.quote}>
              <p className={styles.classes.source}><a href={`https://stage1st.com/2b/forum.php?mod=redirect&goto=findpost&ptid=${quote.tid}&pid=${quote.pid}`} target="_blank" rel="noreferrer">{quote.category} · {quote.date}</a></p>
              <p className={styles.classes.excerpt}>“{quote.text}”</p>
            </div>)}
          </Flex>
        </Flex>
      </Flex>
    </PageLayout>
  </Section>;
}
