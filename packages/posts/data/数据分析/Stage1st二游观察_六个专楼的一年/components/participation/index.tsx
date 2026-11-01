import { AxisBottom, AxisLeft, Bar, BarStackHorizontal, Chart, GridColumns, Group, Line, scaleBand, scaleLinear } from '@blog/mdx-chart';
import { Box, Eyebrow, Flex, Section, PageLayout } from '@blog/mdx-slide';
import { contentGap } from '../../pages/constants';
import { PageTitle } from '../page-title';
import { formatNumber, games, type GameId } from '../../pages/data';
import sharedStyles from '../../pages/shared.jss';
import { chartHeight, chartLeft, compositionKeys, compositionLabels, followupKeys, followupLabels, panelWidth, participationColors, plotHeight, plotWidth } from './constants';
import { participationStages } from './data';
import styles from './style.jss';
import type { ParticipationMode, ParticipationPanel, ParticipationStage } from './types';

const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
const stageLabel = (stage: ParticipationStage) => `${stage.shortLabel}${stage.partial ? '*' : ''}`;

function stageDescription(stage: ParticipationStage) {
  return `${stage.label} · ${stage.start} 至 ${stage.endExclusive}（不含结束日）${stage.baseline ? '；观察起点，历史基线' : ''}${stage.partial ? '；仅覆盖部分区间' : ''}`;
}

function ParticipationChart({ gameId, mode }: { gameId: GameId; mode: ParticipationMode }) {
  const game = games.find(item => item.id === gameId)!;
  const rows = participationStages[gameId];
  const composition = mode === 'composition';
  const width = composition ? plotWidth : plotWidth - 32;
  const x = scaleLinear({ domain: [0, composition ? Math.max(...rows.map(row => row.authors)) : 1], range: [0, width] });
  if (composition) x.nice(4);
  const y = scaleBand({ domain: rows.map((_, i) => i), range: [0, plotHeight], paddingInner: 0.36, paddingOuter: 0.18 });
  const ticks = composition ? x.ticks(4) : [0, 0.5, 1];
  const compositionRows = rows.flatMap((row, index) => row.baseline ? [] : [{ ...row, index }]);
  const followupRows = rows.flatMap((row, index) => row.followup.status === 'complete' ? [{ ...row.followup, stage: row, index }] : []);

  return (
    <Chart width={panelWidth} height={chartHeight} className={styles.classes.chart} role="img" data-axis-maximum={x.domain()[1]} aria-label={`${game.name} · ${composition ? '逐版本参与者构成' : '版本结束后28天再发言情况'} · ${rows.length}个版本或阶段`}>
      <text x={chartLeft} y={18} fill="currentColor" opacity={0.6} fontSize={20}>{composition ? '发言账号数' : '再次发言比例'}</text>
      <text x={panelWidth - 2} y={18} textAnchor="end" fill="currentColor" opacity={0.6} fontSize={20}>{composition ? '合计' : '再发/本版'}</text>
      <Group left={chartLeft} top={34}>
        <GridColumns scale={x} tickValues={ticks} height={plotHeight} stroke="currentColor" strokeOpacity={0.07} />
        {composition && <AxisBottom scale={x} top={plotHeight + 8} tickValues={ticks} hideAxisLine hideTicks tickLength={0}
          tickFormat={value => String(value)}
          tickLabelProps={{ fill: 'currentColor', opacity: 0.6, fontSize: 21, fontFamily: 'inherit', textAnchor: 'middle', dy: 0 }} />}
        <AxisLeft scale={y} left={-12} tickValues={rows.map((_, index) => index)} hideAxisLine hideTicks tickLength={0}
          tickFormat={index => stageLabel(rows[index])}
          tickLabelProps={index => ({ fill: 'currentColor', opacity: rows[Number(index)]?.baseline ? 0.5 : 1, fontSize: 22, fontFamily: 'inherit', textAnchor: 'end', dy: '0.333em' })} />
        {composition ? <>
          <BarStackHorizontal data={compositionRows} keys={[...compositionKeys]} y={row => row.index} xScale={x} yScale={y} color={key => participationColors[key as typeof compositionKeys[number]]}>
            {stacks => stacks.map(stack => stack.bars.map(bar => {
              const count = bar.bar.data[stack.key];
              const insideFontSize = Math.min(22, (bar.width - 2) / (String(count).length * 0.57));
              const inside = count > 0 && insideFontSize >= 17;
              const labelX = inside ? bar.width / 2 : Math.min(width - 10, Math.max(10, bar.x + bar.width / 2)) - bar.x;
              return <Group key={`${bar.bar.data.index}-${stack.key}`} left={bar.x} top={bar.y}>
                <Bar width={bar.width} height={bar.height} fill={bar.color} />
                {!inside && <Line from={{ x: bar.width / 2, y: bar.height }} to={{ x: labelX, y: bar.height + 3 }} stroke={bar.color} strokeWidth={1} />}
                <text data-segment-label={stack.key} data-placement={inside ? 'inside' : 'below'} x={labelX} y={inside ? bar.height / 2 + 8 : bar.height + 17}
                  textAnchor="middle" fill={inside ? '#172b3a' : 'currentColor'} fontSize={inside ? insideFontSize : 18} fontWeight={500}>{count}</text>
                <title>{`${stageDescription(bar.bar.data)}\n${compositionLabels[stack.key]}：${count} 个账号\n首次出现 ${bar.bar.data.first} · 上版延续 ${bar.bar.data.continued} · 隔期回流 ${bar.bar.data.returning} · 合计 ${bar.bar.data.authors}`}</title>
              </Group>;
            }))}
          </BarStackHorizontal>
          {rows.map((row, index) => row.baseline ? <Group key={row.label} top={y(index)}>
            <Bar width={x(row.authors)} height={y.bandwidth()} fill={participationColors.baseline} />
            <text data-segment-label="baseline" data-placement="inside" x={x(row.authors) / 2} y={y.bandwidth() / 2 + 8} textAnchor="middle" fill="#172b3a" fontSize={22} fontWeight={500}>{row.authors}</text>
            <title>{`${stageDescription(row)}\n${row.authors} 个账号；归档从此开始，未区分此前参与情况。`}</title>
          </Group> : null)}
        </> : <>
          <BarStackHorizontal data={followupRows} keys={[...followupKeys]} y={row => row.index} xScale={x} yScale={y} offset="expand" color={key => participationColors[key as typeof followupKeys[number]]}>
            {stacks => stacks.map(stack => stack.bars.map(bar => (
              <Group key={`${bar.bar.data.index}-${stack.key}`} left={bar.x} top={bar.y}>
                <Bar width={bar.width} height={bar.height} fill={bar.color} fillOpacity={bar.bar.data.stage.baseline ? 0.5 : 1} />
                {stack.key === 'returned' && <text x={bar.width / 2} y={bar.height / 2 + 7} textAnchor="middle" fill="white" fontSize={20} fontWeight={500}>{percent(bar.bar.data.returned / bar.bar.data.stage.authors)}</text>}
                <title>{`${stageDescription(bar.bar.data.stage)}\n后续窗口：${bar.bar.data.start} 至 ${bar.bar.data.endExclusive}（不含结束日）\n${followupLabels[stack.key]}：${bar.bar.data[stack.key]}/${bar.bar.data.stage.authors}（${percent(bar.bar.data[stack.key] / bar.bar.data.stage.authors)}）`}</title>
              </Group>
            )))}
          </BarStackHorizontal>
          {rows.map((row, index) => row.followup.status !== 'complete' ? <Group key={row.label} top={y(index)}>
            <Bar width={width} height={y.bandwidth()} fill="currentColor" fillOpacity={0.035} stroke="currentColor" strokeOpacity={0.15} strokeDasharray="4 4" />
            <text x={width / 2} y={y.bandwidth() / 2 + 7} textAnchor="middle" fill="currentColor" opacity={0.5} fontSize={20}>{row.followup.status === 'unknown_version_end' ? '结束日未记录' : '后续不足 28 天'}</text>
            <title>{`${stageDescription(row)}\n${row.followup.status === 'unknown_version_end' ? '未记录真实版本结束日，不计算后续比例' : '没有完整的后续28天，不计算比例'}`}</title>
          </Group> : null)}
        </>}
        {rows.map((row, index) => <text key={row.label} x={panelWidth - chartLeft - 2} y={y(index)! + y.bandwidth() / 2 + 7}
          textAnchor="end" fill="currentColor" opacity={row.baseline ? 0.5 : 0.85} fontSize={composition ? 23 : 19}>
          {composition ? formatNumber(row.authors) : row.followup.status === 'complete' ? `${row.followup.returned}/${row.authors}` : '—'}
        </text>)}
      </Group>
    </Chart>
  );
}

function Legend({ mode }: { mode: ParticipationMode }) {
  const entries = mode === 'composition'
    ? compositionKeys.map(key => ({ key, label: compositionLabels[key], color: participationColors[key] }))
    : followupKeys.map(key => ({ key, label: followupLabels[key], color: participationColors[key] }));
  return <Flex align="center" justify="space-between" className={styles.classes.legend} flex="fixed">
    <Flex align="center" gap={32}>
      {entries.map(entry => <Flex key={entry.key} align="center" gap={10}>
        <Chart width={23} height={16} aria-hidden="true"><Bar width={23} height={16} fill={entry.color} /></Chart>
        <span>{entry.label}</span>
      </Flex>)}
      {mode === 'composition' && <Flex align="center" gap={10}>
        <Chart width={23} height={16} aria-hidden="true"><Bar width={23} height={16} fill={participationColors.baseline} /></Chart>
        <span>观察起点</span>
      </Flex>}
    </Flex>
    {mode === 'followup' && <p className={styles.classes.legendNote}>从版本结束日起，观察之后 28 天是否再次发言</p>}
  </Flex>;
}

export function ParticipationPage({ mode, panels }: { mode: ParticipationMode; panels: readonly ParticipationPanel[] }) {
  const title = mode === 'composition' ? '每个版本，谁来聊？' : '版本过后，谁还在聊？';
  return <Section title={`${title} · ${panels.map(panel => games.find(game => game.id === panel.gameId)!.name).join(' / ')}`} className={sharedStyles.classes.page}>
    <PageLayout>
      <Flex direction="column" height="100%" gap={0}>
        <Box flex="fixed"><Eyebrow>玩家的流向</Eyebrow><PageTitle>{title}</PageTitle></Box>
        <Flex direction="column" flex="fill" margin={`${contentGap}px 0 0`} gap={0}>
          <Legend mode={mode} />
          <Flex flex="fill" justify="space-between" margin="18px 0 0" gap={0}>
            {panels.map(panel => {
              const game = games.find(item => item.id === panel.gameId)!;
              return <Flex key={panel.gameId} direction="column" justify="space-between" width={panelWidth} minWidth={0} gap={0}>
                <Flex align="center" justify="space-between" flex="fixed">
                  <h3 className={styles.classes.gameName} style={{ borderColor: game.color }}>{game.name}</h3>
                  <span className={styles.classes.stageNote}>{game.id === 'arknights' ? '新故事阶段' : `${participationStages[game.id].length} 个区间`}</span>
                </Flex>
                <ParticipationChart gameId={game.id} mode={mode} />
              </Flex>;
            })}
          </Flex>
        </Flex>
      </Flex>
    </PageLayout>
  </Section>;
}
