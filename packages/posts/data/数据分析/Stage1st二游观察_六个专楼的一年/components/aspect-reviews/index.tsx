import { AxisLeft, Bar, BarStackHorizontal, Chart, GridColumns, Group, Line, scaleBand, scaleLinear } from '@blog/mdx-chart';
import { Box, TitleLabel, Flex, Section } from '@blog/mdx-slide';
import { contentGap, pagePadding } from '../../pages/constants';
import { PageTitle } from '../page-title';
import { formatPercent, sentimentColors, sentimentKeys, sentimentLabels, shortTopic } from '../content-analysis/constants';
import { formatNumber, games, type GameId } from '../../pages/data';
import sharedStyles from '../../pages/shared.jss';
import { chartHeight, chartLeft, panelWidth, plotHeight, plotWidth, sentimentDescriptions } from './constants';
import { reviewData } from './data';
import styles from './style.jss';
import type { ReviewRow } from './types';

const total = (row: ReviewRow) => sentimentKeys.reduce((sum, key) => sum + row[key], 0);

function labelPositions(row: ReviewRow) {
  let offset = 0;
  const labels = sentimentKeys.map(key => {
    const share = row[key] / total(row);
    const width = share * plotWidth;
    const text = formatPercent(share);
    const fontSize = Math.min(21, (width - 4) / (text.length * 0.55));
    const label = { key, text, center: offset + width / 2, x: offset + width / 2, inside: fontSize >= 18, fontSize };
    offset += width;
    return label;
  });
  const below = labels.filter(label => !label.inside && row[label.key] > 0);
  for (let i = below.length - 1; i >= 0; i--) below[i].x = Math.min(below[i].center, i === below.length - 1 ? plotWidth - 24 : below[i + 1].x - 50);
  for (let i = 0; i < below.length; i++) below[i].x = Math.max(below[i].x, i === 0 ? 24 : below[i - 1].x + 50);
  return labels;
}

function ReviewChart({ gameId }: { gameId: GameId }) {
  const game = games.find(item => item.id === gameId)!;
  const rows = reviewData[gameId];
  const x = scaleLinear({ domain: [0, 1], range: [0, plotWidth] });
  const y = scaleBand({ domain: rows.map(row => row.topic), range: [0, plotHeight], paddingInner: 0.46, paddingOuter: 0.15 });
  return <Chart width={panelWidth} height={chartHeight} className={styles.classes.chart} role="img" aria-label={`${game.name} · 各方面评价构成`}>
    <text x={chartLeft} y={18} fill="currentColor" opacity={0.6} fontSize={20}>评价占比</text>
    <text x={panelWidth - 2} y={18} textAnchor="end" fill="currentColor" opacity={0.6} fontSize={20}>评价数</text>
    <Group left={chartLeft} top={34}>
      <GridColumns scale={x} tickValues={[0, 0.5, 1]} height={plotHeight} stroke="currentColor" strokeOpacity={0.07} />
      <AxisLeft scale={y} left={-12} hideAxisLine hideTicks tickLength={0} tickFormat={shortTopic}
        tickLabelProps={{ fill: 'currentColor', fontFamily: 'inherit', fontSize: 22, textAnchor: 'end', dy: '0.333em' }} />
      <BarStackHorizontal data={[...rows]} keys={[...sentimentKeys]} y={row => row.topic} xScale={x} yScale={y} offset="expand" color={key => sentimentColors[key as typeof sentimentKeys[number]]}>
        {stacks => stacks.map(stack => stack.bars.map(bar => <Group key={`${bar.bar.data.topic}-${stack.key}`} left={bar.x} top={bar.y}
          data-review-cell={`${gameId}:${bar.bar.data.topic}:${stack.key}`} data-count={bar.bar.data[stack.key]} data-denominator={total(bar.bar.data)}>
          <Bar width={bar.width} height={bar.height} fill={bar.color} />
          <title>{`${game.name} · ${bar.bar.data.topic} · ${sentimentLabels[stack.key]}：${formatNumber(bar.bar.data[stack.key])} / ${formatNumber(total(bar.bar.data))} 条（${formatPercent(bar.bar.data[stack.key] / total(bar.bar.data))}）`}</title>
        </Group>))}
      </BarStackHorizontal>
      {rows.map(row => <Group key={row.topic} top={y(row.topic)} pointerEvents="none">
        {labelPositions(row).filter(label => row[label.key] > 0).map(label => <Group key={label.key}>
          {!label.inside && <Line from={{ x: label.center, y: y.bandwidth() }} to={{ x: label.x, y: y.bandwidth() + 5 }} stroke={sentimentColors[label.key]} strokeWidth={1} />}
          <text data-review-label={label.key} x={label.x} y={label.inside ? y.bandwidth() / 2 + 7 : y.bandwidth() + 23} textAnchor="middle"
            fill={label.inside ? '#172b3a' : 'currentColor'} opacity={label.inside ? 1 : 0.7} fontSize={label.inside ? label.fontSize : 17} fontWeight={500}>{label.text}</text>
        </Group>)}
        <text data-review-total={`${gameId}:${row.topic}`} x={panelWidth - chartLeft - 2} y={y.bandwidth() / 2 + 7} textAnchor="end" fill="currentColor" fontSize={22}>{formatNumber(total(row))}</text>
      </Group>)}
    </Group>
  </Chart>;
}

export function AspectReviewsPage({ gameIds }: { gameIds: readonly GameId[] }) {
  return <Section title={`各方面评价 · ${gameIds.map(id => games.find(game => game.id === id)!.name).join(' / ')}`} className={sharedStyles.classes.page}>
    <Flex direction="column" height="100%" padding={pagePadding} gap={0}>
      <Box flex="fixed"><TitleLabel>大家在聊什么</TitleLabel><PageTitle>大家在称赞什么，又在抱怨什么？</PageTitle></Box>
      <Flex direction="column" flex="fill" margin={`${contentGap}px 0 0`} gap={0}>
        <Flex justify="space-between" align="center" flex="fixed" className={styles.classes.legend}>
          <Flex align="center" gap={32}>
            {sentimentKeys.map(key => <Flex key={key} align="center" gap={10}>
              <Chart width={23} height={16} aria-hidden="true"><Bar width={23} height={16} fill={sentimentColors[key]} /></Chart>
              <span>{sentimentLabels[key]}<span className={styles.classes.legendDescription}>{sentimentDescriptions[key]}</span></span>
            </Flex>)}
          </Flex>
          <p className={styles.classes.note}>按该方面的评价计算；未表达态度的帖子不计入</p>
        </Flex>
        <Flex flex="fill" justify="space-between" margin="18px 0 0" gap={0}>
          {gameIds.map(gameId => {
            const game = games.find(item => item.id === gameId)!;
            return <Flex key={gameId} direction="column" justify="space-between" width={panelWidth} minWidth={0} gap={0}>
              <h3 className={styles.classes.gameName} style={{ borderColor: game.color }}>{game.name}</h3>
              <ReviewChart gameId={gameId} />
            </Flex>;
          })}
        </Flex>
      </Flex>
    </Flex>
  </Section>;
}
