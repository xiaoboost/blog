import { AxisBottom, AxisLeft, Bar, Chart, Circle, GridRows, Group, Line, LinePath, scaleLinear } from '@blog/mdx-chart';
import { Box, Eyebrow, Flex, Section, PageLayout } from '@blog/mdx-slide';
import { contentGap } from '../../pages/constants';
import { PageTitle } from '../page-title';
import { formatNumber } from '../../pages/data';
import sharedStyles from '../../pages/shared.jss';
import { dayCount, dayIndex, monthTicks, prepareSeries, stageMeanColor, yMaximum, yTicks, type TrendSeries } from './data';
import { trendChartHeight, trendChartWidth, trendPlotHeight, trendPlotWidth } from './constants';
import styles from './style.jss';

function YearlyTrendChart({ series }: { series: TrendSeries }) {
  const game = prepareSeries(series);
  const width = trendPlotWidth;
  const height = trendPlotHeight;
  const x = scaleLinear({ domain: [0, dayCount], range: [0, width] });
  const y = scaleLinear({ domain: [0, yMaximum], range: [height, 0] });
  return (
    <Chart width={trendChartWidth} height={trendChartHeight} className={styles.classes.chart} role="img" aria-label={`${game.name}年度版本趋势：每日回复、7日均线、区间日均${game.eventDates.length ? '与关键事件' : ''}`}>
      <title>{`${game.name}，2025年10月28日至2026年10月27日。六楼统一纵轴0至500条每天。均线按当天及此前六天计算；最初六天按已有天数计算。${game.eventDates.length ? '圆点是事件当日的实际回复数。' : ''}`}</title>
      <Group left={80} top={80}>
        {game.stages.map((stage, index) => {
          const left = x(dayIndex(stage.start));
          const right = x(dayIndex(stage.endExclusive));
          const narrow = right - left < 80;
          const labelX = narrow ? (index === 0 ? left : right) : (left + right) / 2;
          return (
            <Group key={stage.start} data-stage={stage.label}>
              <Bar x={left} width={right - left} height={height} fill={stage.prerelease ? 'currentColor' : game.color} fillOpacity={stage.prerelease ? 0.045 : index % 2 === 0 ? 0.07 : 0.025} />
              <Line from={{ x: left, y: 0 }} to={{ x: left, y: height }} stroke="currentColor" strokeOpacity={0.13} strokeDasharray={stage.partial ? '5 4' : undefined} />
              <text x={labelX} y={narrow ? -47 : -20} textAnchor={narrow ? index === 0 ? 'start' : 'end' : 'middle'} fill="currentColor" fontSize={24}>
                {stage.shortLabel}{stage.partial ? '*' : ''}
              </text>
              <title>{`${stage.label}${stage.partial ? '（部分区间）' : ''}：${stage.start} 至 ${stage.endExclusive}（不含结束日）；${stage.days} 天，${formatNumber(stage.replies)} 条回复，日均 ${stage.dailyMean.toFixed(1)} 条，${stage.accounts} 个账号`}</title>
            </Group>
          );
        })}
        <GridRows scale={y} tickValues={yTicks} width={width} stroke="currentColor" strokeOpacity={0.09} />
        <LinePath data={game.points} x={point => x(point.day)} y={point => y(point.replies)} stroke={game.color} strokeOpacity={0.35} strokeWidth={1.8} />
        <LinePath data={game.points} x={point => x(point.day)} y={point => y(point.average)} stroke={game.color} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
        {game.stages.map(stage => (
          <Line key={stage.start} data-stage-mean={stage.label} from={{ x: x(dayIndex(stage.start)), y: y(stage.dailyMean) }} to={{ x: x(dayIndex(stage.endExclusive)), y: y(stage.dailyMean) }} stroke={stageMeanColor} strokeWidth={2.8} strokeDasharray="10 6" />
        ))}
        <AxisLeft scale={y} tickValues={yTicks} left={-12} hideAxisLine hideTicks tickLength={0}
          tickLabelProps={{ fill: 'currentColor', opacity: 0.65, fontFamily: 'inherit', fontSize: 24, dx: 0, dy: '0.333em' }} />
        <AxisBottom scale={x} top={height + 14} tickValues={monthTicks.map(tick => tick.day)} hideAxisLine hideTicks tickLength={0}
          tickFormat={value => monthTicks.find(tick => tick.day === Number(value))!.label}
          tickLabelProps={{ fill: 'currentColor', opacity: 0.65, fontFamily: 'inherit', fontSize: 25, dy: 0 }} />
        <text x={-12} y={-20} textAnchor="end" fill="currentColor" opacity={0.65} fontSize={22}>条 / 日</text>
        {game.eventDates.map(event => (
          <Circle key={event.date} data-event-date={event.date} cx={x(event.day)} cy={y(event.replies)} r={6.5}
            fill={game.color} stroke={game.color} strokeWidth={2}>
            <title>{`${event.date} · ${event.replies} 条回复\n${event.events.map(item => item.title).join('\n')}`}</title>
          </Circle>
        ))}
        {game.annotations.map(event => {
          const px = x(dayIndex(event.date));
          const py = y(series.daily[dayIndex(event.date)]);
          const halfWidth = Math.max(80, event.label.length * 12);
          const labelX = Math.max(halfWidth, Math.min(width - halfWidth, px + event.dx));
          const labelY = Math.max(28, Math.min(height - 70, py + event.dy));
          return (
            <Group key={event.date} data-event-label={event.date}>
              <Line from={{ x: px, y: py - 9 }} to={{ x: labelX, y: labelY + 36 }} stroke={game.color} strokeOpacity={0.65} strokeWidth={1.2} />
              <text x={labelX} y={labelY} textAnchor="middle" fill="currentColor" fontSize={21} className={styles.classes.annotation}>
                {event.date.slice(5).replace('-', '/')}
                <tspan x={labelX} dy={28} fontSize={24}>{event.label}</tspan>
              </text>
            </Group>
          );
        })}
      </Group>
    </Chart>
  );
}

export function YearlyTrends({ series }: { series: TrendSeries }) {
  const c = styles.classes;
  const s = sharedStyles.classes;
  const game = prepareSeries(series);
  const stageLabel = series.stageKind === 'story_phase' ? '阶段日均' : '版本日均';
  const title = game.name;
  return (
    <Section title={title} className={s.page}>
      <PageLayout>
        <Flex direction="column" height="100%" gap={0}>
          <Box flex="fixed"><Eyebrow>讨论的时间线</Eyebrow><PageTitle>{title}</PageTitle></Box>
          <Flex direction="column" justify="space-between" gap={0} flex="fill" margin={`${contentGap}px 0 0`}>
            <Flex justify="space-between" align="center" gap={0} flex="fixed" className={c.caption}>
              <Flex gap={28} align="center" className={c.legend}>
                {[
                  { label: '每日回复', color: game.color, opacity: 0.35, width: 1.8 },
                  { label: '7 日均线', color: game.color, opacity: 1, width: 4 },
                  { label: stageLabel, color: stageMeanColor, opacity: 1, width: 2.8, dash: '10 6' },
                ].map(item => (
                  <Flex key={item.label} align="center" gap={12}>
                    <Chart width={46} height={24} aria-hidden="true"><Line from={{ x: 0, y: 12 }} to={{ x: 46, y: 12 }} stroke={item.color} strokeWidth={item.width} strokeOpacity={item.opacity} strokeDasharray={item.dash} /></Chart>
                    <span>{item.label}</span>
                  </Flex>
                ))}
              </Flex>
              <p className={c.note}>* 表示只覆盖部分区间</p>
            </Flex>
            <YearlyTrendChart series={series} />
          </Flex>
        </Flex>
      </PageLayout>
    </Section>
  );
}
