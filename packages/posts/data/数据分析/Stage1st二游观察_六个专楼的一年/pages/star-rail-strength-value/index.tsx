import { AxisLeft, Bar, Chart, Circle, GridRows, Group, Line, LinePath, scaleLinear } from '@blog/mdx-chart';
import { Box, Eyebrow, Flex, Section, PageLayout } from '@blog/mdx-slide';
import { PageTitle } from '../../components/page-title';
import { sentimentColors } from '../../components/content-analysis/constants';
import { contentGap } from '../constants';
import sharedStyles from '../shared.jss';
import { versions } from './data';
import styles from './style.jss';

const series = [
  { key: 'strengthPraise', label: '强度与实用：称赞', color: sentimentColors.positive },
  { key: 'powerComplaints', label: '数值与保值：抱怨', color: sentimentColors.negative },
] as const;

function StrengthValueChart() {
  const width = 1600;
  const height = 500;
  const x = scaleLinear({ domain: [-0.4, versions.length - 0.6], range: [0, width] });
  const y = scaleLinear({ domain: [0, 0.072], range: [height, 0] });
  return <Chart width={1720} height={600} className={styles.classes.chart} role="img" aria-label="星穹铁道强度称赞与保值抱怨的版本占比">
    <title>按发帖日期归入版本，两条线均以该版本期间全部可分析楼帖为分母；3.7至4.6，4.6截至2026年10月27日。</title>
    <Group left={80} top={20}>
      <Bar x={x(6.5)} width={x(7.5) - x(6.5)} height={height} fill={sentimentColors.negative} fillOpacity={0.065} />
      <Bar x={x(7.5)} width={width - x(7.5)} height={height} fill="currentColor" fillOpacity={0.025} />
      <GridRows scale={y} tickValues={[0, 0.02, 0.04, 0.06]} width={width} stroke="currentColor" strokeOpacity={0.09} />
      <AxisLeft scale={y} tickValues={[0, 0.02, 0.04, 0.06]} left={-12} hideAxisLine hideTicks tickLength={0}
        tickFormat={value => `${Number(value) * 100}%`}
        tickLabelProps={{ fill: 'currentColor', opacity: 0.65, fontFamily: 'inherit', fontSize: 24, dy: '0.333em' }} />
      {series.map(item => <Group key={item.key}>
        <LinePath data={[...versions]} x={(_, index) => x(index)} y={point => y(point[item.key] / point.total)} data-trend-series={item.key}
          stroke={item.color} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
        {versions.map((point, index) => <Circle key={point.version} cx={x(index)} cy={y(point[item.key] / point.total)} r={6.5}
          fill={item.color} data-trend-point={`${item.key}:${point.version}`} data-share={point[item.key] / point.total}>
          <title>{`${point.version} · ${item.label}：${(100 * point[item.key] / point.total).toFixed(1)}%`}</title>
        </Circle>)}
      </Group>)}
      {([{ index: 6, series: series[0] }, { index: 7, series: series[1] }] as const).map(({ index, series: item }) => <text key={item.key} x={x(index)} y={y(versions[index][item.key] / versions[index].total) - 24}
        textAnchor="middle" fill={item.color} fontSize={27} fontWeight={600}>
        {(100 * versions[index][item.key] / versions[index].total).toFixed(1)}%
      </text>)}
      {versions.map((point, index) => <text key={point.version} x={x(index)} y={height + 38} textAnchor="middle" fill="currentColor" opacity={0.65} fontSize={24}>
        {point.version}
        {point.partial ? <tspan x={x(index)} dy={28} fontSize={20}>截至10月27日</tspan> : null}
      </text>)}
    </Group>
  </Chart>;
}

export function StarRailStrengthValue() {
  return <Section title="星穹铁道：数值与保值的版本变化" className={sharedStyles.classes.page}>
    <PageLayout>
      <Flex direction="column" height="100%" gap={0}>
        <Box flex="fixed">
          <Eyebrow>大家在聊什么</Eyebrow>
          <PageTitle>星穹铁道：对数值与保值的抱怨，何时变多了？</PageTitle>
          <div className={styles.classes.subtitle}>
            <p>铁道楼最常称赞强度与实用，对数值与保值的抱怨占比又居六楼首位。</p>
            <p>这两种评价为何并存？看看它们随版本更新的变化。</p>
          </div>
        </Box>
        <Flex direction="column" flex="fill" justify="space-between" gap={0} margin={`${contentGap}px 0 0`}>
          <Flex align="center" justify="space-between" flex="fixed" gap={24}>
            <Flex align="center" gap={40} className={styles.classes.legend}>
              {series.map(item => <Flex key={item.key} align="center" gap={12}>
                <Chart width={46} height={24} aria-hidden="true"><Line from={{ x: 0, y: 12 }} to={{ x: 46, y: 12 }} stroke={item.color} strokeWidth={4} /><Circle cx={23} cy={12} r={5} fill={item.color} /></Chart>
                <span>{item.label}</span>
              </Flex>)}
            </Flex>
            <p className={styles.classes.note}>占该版本期间可分析楼帖的比例</p>
          </Flex>
          <StrengthValueChart />
          <p className={styles.classes.conclusion}>对强度与实用的称赞占比<strong>相对稳定</strong>，数值与保值的抱怨占比则从 <strong>4.3 起连续上升</strong>，在 <strong>4.5 达到峰值</strong>。</p>
        </Flex>
      </Flex>
    </PageLayout>
  </Section>;
}
