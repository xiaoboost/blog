import { AxisLeft, Bar, Chart, Circle, GridRows, Group, Line, LinePath, scaleLinear } from '@blog/mdx-chart';
import { Box, Eyebrow, Flex, Section, PageLayout } from '@blog/mdx-slide';
import { PageTitle } from '../../components/page-title';
import { contentGap } from '../constants';
import sharedStyles from '../shared.jss';
import { stages, topics } from './data';
import styles from './style.jss';

function VersionTopicChart() {
  const width = 1600;
  const height = 500;
  const x = scaleLinear({ domain: [-0.35, stages.length - 0.65], range: [0, width] });
  const y = scaleLinear({ domain: [0, 0.35], range: [height, 0] });
  const ticks = [0, 0.1, 0.2, 0.3];
  const focusIndex = stages.findIndex(stage => stage.version === '3.1');
  const focus = stages[focusIndex];
  return <Chart width={1720} height={600} className={styles.classes.chart} role="img" aria-label="鸣潮九个话题随版本变化的帖子占比">
    <title>每条线表示涉及该话题的帖子占该版本可分析楼帖的比例；一帖可涉及多个话题。横轴按发帖时所处版本等间距排列，2.7和3.7仅覆盖部分版本。</title>
    <Group left={80} top={20}>
      <Bar x={x(focusIndex - 0.36)} width={x(focusIndex + 0.36) - x(focusIndex - 0.36)} height={height} fill="currentColor" fillOpacity={0.035} />
      <GridRows scale={y} tickValues={ticks} width={width} stroke="currentColor" strokeOpacity={0.09} />
      <AxisLeft scale={y} tickValues={ticks} left={-12} hideAxisLine hideTicks tickLength={0}
        tickFormat={value => `${Number(value) * 100}%`}
        tickLabelProps={{ fill: 'currentColor', opacity: 0.65, fontFamily: 'inherit', fontSize: 24, dy: '0.333em' }} />
      {[...topics.filter(topic => !topic.primary), ...topics.filter(topic => topic.primary)].map(topic => <Group key={topic.name}>
        <LinePath data={[...stages]} x={(_, index) => x(index)} y={stage => y(stage.counts[topic.name] / stage.total)}
          data-topic-series={topic.name} stroke={topic.color} strokeWidth={topic.primary ? 4 : 2.2}
          strokeOpacity={topic.primary ? 1 : 0.5} strokeLinejoin="round" strokeLinecap="round" />
        {stages.map((stage, index) => <Circle key={stage.version} cx={x(index)} cy={y(stage.counts[topic.name] / stage.total)}
          r={topic.primary ? 6.5 : 3.5} fill={topic.color} fillOpacity={topic.primary ? 1 : 0.5}
          data-topic-point={`${topic.name}:${stage.version}`} data-share={stage.counts[topic.name] / stage.total}>
          <title>{`${stage.version} · ${topic.name}：${(100 * stage.counts[topic.name] / stage.total).toFixed(1)}%`}</title>
        </Circle>)}
      </Group>)}
      {topics.filter(topic => topic.primary).map(topic => {
        const share = focus.counts[topic.name] / focus.total;
        const story = topic.name === '故事与世界';
        const gameplay = topic.name === '玩法与挑战';
        return <text key={topic.name} x={x(focusIndex) + (story ? 0 : gameplay ? -18 : 18)}
          y={y(share) + (story ? -22 : gameplay ? 33 : 54)} textAnchor={story ? 'middle' : gameplay ? 'end' : 'start'}
          fill={topic.color} fontSize={27} fontWeight={600} data-focus-label={topic.name}>
          {(100 * share).toFixed(1)}%
        </text>;
      })}
      {stages.map((stage, index) => <text key={stage.version} x={x(index)} y={height + 38} textAnchor="middle"
        fill="currentColor" opacity={stage.version === '3.1' ? 1 : 0.65} fontSize={25} fontWeight={stage.version === '3.1' ? 600 : 400}>
        {stage.version}
        {stage.partial ? <tspan x={x(index)} dy={28} fontSize={19}>部分版本</tspan> : null}
      </text>)}
    </Group>
  </Chart>;
}

function Legend({ primary }: { primary: boolean }) {
  return <Flex align="center" gap={primary ? 40 : 28} className={primary ? styles.classes.legend : styles.classes.secondaryLegend}>
    {topics.filter(topic => topic.primary === primary).map(topic => <Flex key={topic.name} align="center" gap={12}>
      <Chart width={38} height={24} aria-hidden="true"><Line from={{ x: 0, y: 12 }} to={{ x: 38, y: 12 }} stroke={topic.color} strokeWidth={primary ? 4 : 2.2} strokeOpacity={primary ? 1 : 0.6} /><Circle cx={19} cy={12} r={primary ? 5 : 3.5} fill={topic.color} fillOpacity={primary ? 1 : 0.6} /></Chart>
      <span>{topic.name}</span>
    </Flex>)}
  </Flex>;
}

export function WutheringVersionTopics() {
  return <Section title="鸣潮：讨论重心如何随版本变化？" className={sharedStyles.classes.page}>
    <PageLayout>
      <Flex direction="column" height="100%" gap={0}>
        <Box flex="fixed">
          <Eyebrow>大家在聊什么</Eyebrow>
          <PageTitle>鸣潮：讨论重心如何随版本变化？</PageTitle>
          <p className={styles.classes.subtitle}>鸣潮全年的话题分布较为均衡。放到各个版本里，这种均衡一直存在吗？</p>
        </Box>
        <Flex direction="column" flex="fill" justify="space-between" gap={0} margin={`${contentGap}px 0 0`}>
          <Flex direction="column" flex="fixed" gap={10}>
            <Flex align="center" justify="space-between" gap={24}>
              <Legend primary />
              <p className={styles.classes.note}>占该版本可分析楼帖的比例 · 一帖可涉及多个话题</p>
            </Flex>
            <Legend primary={false} />
          </Flex>
          <VersionTopicChart />
          <p className={styles.classes.conclusion}><strong>3.1 的讨论重心发生变化</strong>：玩法占比降至 <strong>19.2%</strong>，故事与角色分别达到 <strong>24.8%</strong>、<strong>21.2%</strong>，都超过了玩法。</p>
        </Flex>
      </Flex>
    </PageLayout>
  </Section>;
}
