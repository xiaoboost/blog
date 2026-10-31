import { AxisBottom, AxisLeft, AxisTop, Bar, Chart, GridColumns, Group, HeatmapRect, scaleBand, scaleLinear } from '@blog/mdx-chart';
import { Box, TitleLabel, Flex, Section } from '@blog/mdx-slide';
import { accentColor, contentGap, pagePadding } from '../constants';
import { PageTitle } from '../../components/page-title';
import { formatNumber, games, uniqueAccounts } from '../data';
import sharedStyles from '../shared.jss';
import { formatPercent, heatmapMaximum, multiThreadAccounts, overlapColumns, participation } from './data';
import styles from './style.jss';

function OverlapHeatmap() {
  const domain = games.map((_, i) => i);
  const x = scaleBand({ domain, range: [0, 820], paddingInner: 8 / 138 });
  const y = scaleBand({ domain, range: [0, 533], paddingInner: 9 / 77 });
  const opacity = scaleLinear({ domain: [0, heatmapMaximum], range: [0.08, 0.62], clamp: true });
  return (
    <Chart width={1000} height={600} className={styles.classes.chart} role="img" aria-label="六楼账号重叠热力图">
      <Group left={160} top={64}>
        <AxisTop
          scale={x} top={-29} hideAxisLine hideTicks tickLength={0}
          tickFormat={i => games[i].name}
          tickLabelProps={{ fill: 'currentColor', fontFamily: 'inherit', fontSize: 25, dy: 0 }}
        />
        <AxisLeft
          scale={y} left={-20} hideAxisLine hideTicks tickLength={0}
          tickFormat={i => games[i].name}
          tickLabelProps={{ fill: 'currentColor', fontFamily: 'inherit', fontSize: 27, dx: 0, dy: '0.333em' }}
        />
        <HeatmapRect
          data={overlapColumns}
          xScale={i => x(i)!} yScale={i => y(i)!}
          binWidth={x.bandwidth()} binHeight={y.bandwidth()} gap={0}
          bins={column => column.bins}
          count={bin => bin.cell?.share ?? -1}
          colorScale={value => Number(value) < 0 ? 'currentColor' : accentColor}
          opacityScale={value => Number(value) < 0 ? 0.035 : opacity(value)}
        >
          {columns => columns.map(column => column.map(({ bin, datum, row, x: cellX, y: cellY, width, height, color, opacity: cellOpacity }) => (
            <Group key={`${datum.id}-${row}`} left={cellX} top={cellY}>
              <Bar width={width} height={height} rx={3} fill={color} fillOpacity={cellOpacity} />
              {bin.cell ? (
                <text x={width / 2} y={height / 2 + 9} textAnchor="middle" fill="currentColor" fontSize={28}>{formatPercent(bin.cell.share)}</text>
              ) : (
                <text x={width / 2} y={height / 2 - 3} textAnchor="middle" fill="currentColor" fontSize={28} fontWeight={500}>
                  {formatNumber(bin.accounts)}
                  <tspan x={width / 2} dy={22} fontSize={17} fontWeight={400} opacity={0.65}>个账号</tspan>
                </text>
              )}
              <title>{bin.cell
                ? `${bin.source} → ${datum.name}：${bin.cell.shared} 个共同账号 / ${bin.accounts} 个本行账号 = ${formatPercent(bin.cell.share)}`
                : `${bin.source}：${formatNumber(bin.accounts)} 个发言账号`}</title>
            </Group>
          )))}
        </HeatmapRect>
      </Group>
    </Chart>
  );
}

function ParticipationChart() {
  const x = scaleLinear({ domain: [0, 1200], range: [0, 330] });
  const y = scaleBand({ domain: participation.map(row => row.threads), range: [0, 470], paddingInner: 30 / 70 });
  const ticks = [0, 600, 1200];
  return (
    <Chart width={660} height={600} className={styles.classes.chart} role="img" aria-label={`参与专楼数分布：${participation.map(row => `${row.threads}个楼${row.accounts}个账号`).join('，')}。`}>
      <text x={535} y={35} textAnchor="end" fill="currentColor" opacity={0.65} fontSize={23}>账号数</text>
      <text x={650} y={35} textAnchor="end" fill="currentColor" opacity={0.65} fontSize={23}>占比</text>
      <Group left={98} top={75}>
        <GridColumns scale={x} tickValues={ticks} top={-11} height={492} stroke="currentColor" strokeOpacity={0.08} />
        <AxisBottom
          scale={x} top={496} tickValues={ticks} hideAxisLine hideTicks tickLength={0}
          tickFormat={n => formatNumber(Number(n))}
          tickLabelProps={{ fill: 'currentColor', opacity: 0.65, fontFamily: 'inherit', fontSize: 21, dy: 0 }}
        />
        <AxisLeft
          scale={y} left={-20} hideAxisLine hideTicks tickLength={0}
          tickFormat={n => `${n} 个楼`}
          tickLabelProps={{ fill: 'currentColor', fontFamily: 'inherit', fontSize: 27, dx: 0, dy: '0.333em' }}
        />
        {participation.map(row => (
          <Group key={row.threads} top={y(row.threads)}>
            <Bar width={x(row.accounts)} height={y.bandwidth()} rx={2} fill={row.threads === 1 ? 'currentColor' : accentColor} fillOpacity={row.threads === 1 ? 0.2 : 1} />
            <text x={437} y={y.bandwidth() / 2 + 9} textAnchor="end" fill="currentColor" fontSize={28}>{formatNumber(row.accounts)}</text>
            <text x={552} y={y.bandwidth() / 2 + 9} textAnchor="end" fill="currentColor" opacity={0.65} fontSize={25}>{formatPercent(row.share)}</text>
            <title>{`${row.threads} 个楼：${formatNumber(row.accounts)} 个账号，占全部 ${formatNumber(uniqueAccounts)} 个账号的 ${formatPercent(row.share)}`}</title>
          </Group>
        ))}
      </Group>
    </Chart>
  );
}

export function Overlap() {
  const c = styles.classes;
  const s = sharedStyles.classes;
  return (
    <Section title="跨楼重叠与参与范围" className={s.page}>
      <Flex direction="column" height="100%" padding={pagePadding} gap={0}>
        <Box flex="fixed">
          <TitleLabel>再看发言者</TitleLabel>
          <PageTitle>这些发言者，还会去哪些专楼？</PageTitle>
        </Box>
        <Flex justify="space-between" gap={0} flex="fill" margin={`${contentGap}px 0 0`}>
          <Flex direction="column" justify="space-between" gap={0} width={1000} minWidth={0}>
            <h3>哪些专楼共享发言者</h3>
            <OverlapHeatmap />
            <Flex direction="column" gap={0} flex="fixed" className={`${c.summary} ${c.observations}`}>
              <p><strong>米家三楼</strong>的发言账号重叠较高，两两约为 38%—50%。</p>
              <p><strong>方舟楼</strong>有 64.8% 的账号也在终末地楼发过言，超过一半。</p>
              <p><strong>鸣潮楼</strong>与其他楼重叠较少：终末地为 29.3%，其余四楼均不足 12%。</p>
            </Flex>
          </Flex>
          <Flex direction="column" justify="space-between" gap={0} width={660} minWidth={0}>
            <h3>一个账号，参与几个专楼</h3>
            <ParticipationChart />
            <Box flex="fixed" className={c.summary}>
              <p className={c.chartNote}><strong className={c.share}>{formatPercent(multiThreadAccounts / uniqueAccounts)}</strong> 的账号在至少两个楼发过言，共 {formatNumber(multiThreadAccounts)} 个。</p>
            </Box>
          </Flex>
        </Flex>
      </Flex>
    </Section>
  );
}
