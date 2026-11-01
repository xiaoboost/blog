import { AxisLeft, Bar, Chart, GridColumns, Group, Line, scaleBand, scaleLinear } from '@blog/mdx-chart';
import { Box, Eyebrow, Flex, Section, PageLayout } from '@blog/mdx-slide';
import { contentGap } from '../../pages/constants';
import { PageTitle } from '../page-title';
import { formatPercent, sentimentColors, sentimentKeys, sentimentLabels, shortTopic } from '../content-analysis/constants';
import { formatNumber, games, type GameId } from '../../pages/data';
import sharedStyles from '../../pages/shared.jss';
import { chartHeight, chartLeft, countPanelWidth, sharePanelWidth, plotHeight, sentimentDescriptions } from './constants';
import { reviewData, overallReviewData } from './data';
import styles from './style.jss';
import type { ReviewRow } from './types';

const total = (row: ReviewRow) => sentimentKeys.reduce((sum, key) => sum + row[key], 0);

function proportionLabels(row: ReviewRow, plotWidth: number) {
  let offset = 0;
  const labels = sentimentKeys.map(key => {
    const width = row[key] / total(row) * plotWidth;
    const text = formatPercent(row[key] / total(row));
    const inside = width >= text.length * 12 + 10;
    const label = { key, text, center: offset + width / 2, x: offset + width / 2, inside };
    offset += width;
    return label;
  });
  const below = labels.filter(label => !label.inside && row[label.key] > 0);
  for (let i = below.length - 1; i >= 0; i--) below[i].x = Math.min(below[i].center, i === below.length - 1 ? plotWidth - 28 : below[i + 1].x - 64);
  for (let i = 0; i < below.length; i++) below[i].x = Math.max(below[i].x, i === 0 ? 28 : below[i - 1].x + 64);
  return labels;
}

function ReviewChart({ scope, name, rows, mode }: { scope: string; name: string; rows: readonly ReviewRow[]; mode: 'count' | 'share' }) {
  const isCount = mode === 'count';
  const panelWidth = isCount ? countPanelWidth : sharePanelWidth;
  const left = isCount ? chartLeft : 0;
  const plotWidth = isCount ? panelWidth - left - 86 : panelWidth;
  // All six games share a count scale; the pooled chart uses its own scale.
  const maximum = isCount ? (scope === 'overall' ? 20000 : 6000) : 1;
  const x = scaleLinear({ domain: [0, maximum], range: [0, plotWidth] });
  const y = scaleBand({ domain: rows.map(row => row.topic), range: [0, plotHeight], paddingInner: 0.56, paddingOuter: 0.15 });
  return <Chart width={panelWidth} height={chartHeight} className={styles.classes.chart} role="img" aria-label={`${name} · ${isCount ? '各方面评价数量' : '各方面评价内部比例'}`}>
    {[0, maximum / 2, maximum].map(value => <text key={value} x={left + x(value)} y={24} textAnchor={value === 0 ? 'start' : value === maximum ? 'end' : 'middle'} fill="currentColor" opacity={0.65} fontSize={20}>{isCount ? formatNumber(value) : formatPercent(value)}</text>)}
    {isCount && <text x={panelWidth - 2} y={24} textAnchor="end" fill="currentColor" opacity={0.65} fontSize={20}>合计</text>}
    <Group left={left} top={42}>
      <GridColumns scale={x} tickValues={[0, maximum / 2, maximum]} height={plotHeight} stroke="currentColor" strokeOpacity={0.07} />
      {isCount && <AxisLeft scale={y} left={-12} hideAxisLine hideTicks tickLength={0} tickFormat={shortTopic}
        tickLabelProps={{ fill: 'currentColor', fontFamily: 'inherit', fontSize: 22, textAnchor: 'end', dy: '0.333em' }} />}
      {rows.map(row => {
        let offset = 0;
        const segments = sentimentKeys.map(key => {
          const value = isCount ? row[key] : row[key] / total(row);
          const text = formatNumber(row[key]);
          const segment = { key, x: x(offset), width: x(value), text };
          offset += value;
          return segment;
        });
        return <Group key={row.topic} top={y(row.topic)}>
          {segments.map(segment => <Group key={segment.key} left={segment.x}
            data-review-cell={`${scope}:${row.topic}:${segment.key}`} data-review-mode={mode} data-count={row[segment.key]} data-denominator={total(row)}>
            <Bar width={segment.width} height={y.bandwidth()} fill={sentimentColors[segment.key]} />
            <title>{`${name} · ${row.topic} · ${sentimentLabels[segment.key]}：${formatNumber(row[segment.key])} / ${formatNumber(total(row))} 条（${formatPercent(row[segment.key] / total(row))}）`}</title>
          </Group>)}
          {isCount ? <>
            <text data-review-total={`${scope}:${row.topic}`} x={plotWidth + 82} y={y.bandwidth() / 2 + 7} textAnchor="end" fill="currentColor" fontSize={22}>{formatNumber(total(row))}</text>
            <text x={0} y={y.bandwidth() + 25} fontSize={20}>
              {segments.map((segment, index) => <tspan key={segment.key}>
                {index > 0 && <tspan fill="currentColor" opacity={0.4}> / </tspan>}
                <tspan data-review-count-label={segment.key} fill={sentimentColors[segment.key]}
                  aria-label={`${sentimentLabels[segment.key]} ${segment.text} 条`}>{segment.text}</tspan>
              </tspan>)}
            </text>
          </> : proportionLabels(row, plotWidth).filter(label => row[label.key] > 0).map(label => <Group key={label.key}>
            {!label.inside && <Line from={{ x: label.center, y: y.bandwidth() }} to={{ x: label.x, y: y.bandwidth() + 5 }} stroke={sentimentColors[label.key]} strokeWidth={1} />}
            <text data-review-label={label.key} x={label.x} y={label.inside ? y.bandwidth() / 2 + 7 : y.bandwidth() + 25} textAnchor="middle"
              fill={label.inside ? '#172b3a' : 'currentColor'} opacity={label.inside ? 1 : 0.7} fontSize={label.inside ? 21 : 19}>{label.text}</text>
          </Group>)}
        </Group>;
      })}
    </Group>
  </Chart>;
}

export function AspectReviewsPage({ gameId }: { gameId: GameId | 'overall' }) {
  const name = games.find(item => item.id === gameId)?.name ?? '六楼合并';
  const rows = gameId === 'overall' ? overallReviewData : reviewData[gameId];
  return <Section title={`各方面评价 · ${name}`} className={sharedStyles.classes.page}>
    <PageLayout>
      <Flex direction="column" height="100%" gap={0}>
        <Box flex="fixed"><Eyebrow>大家在聊什么 · {name}</Eyebrow><PageTitle>大家在称赞什么，又在抱怨什么？</PageTitle></Box>
        <Flex direction="column" flex="fill" margin={`${contentGap}px 0 0`} gap={0} justify="space-between">
          <Flex justify="space-between" align="center" gap={24} flex="fixed" className={styles.classes.legendRow}>
            <Flex align="center" gap={32} className={styles.classes.legend}>
            {sentimentKeys.map(key => <Flex key={key} align="center" gap={10}>
              <Chart width={23} height={16} aria-hidden="true"><Bar width={23} height={16} fill={sentimentColors[key]} /></Chart>
              <span>{sentimentLabels[key]}<span className={styles.classes.legendDescription}>{sentimentDescriptions[key]}</span></span>
            </Flex>)}
            </Flex>
            <p className={styles.classes.note}>未表达态度的帖子不计入；一帖可评价多个方面。
              {gameId === 'overall' && <span className={styles.classes.pooledNote}>六楼按帖子合并，发帖多的楼权重更大。</span>}
            </p>
          </Flex>
          <Flex justify="space-between" gap={0} flex="fixed">
            {(['count', 'share'] as const).map(mode => <Flex key={mode} direction="column" width={mode === 'count' ? countPanelWidth : sharePanelWidth} gap={8}>
              <h3 className={styles.classes.chartTitle} style={{ paddingLeft: mode === 'count' ? chartLeft : 0 }}>{mode === 'count' ? '评价数量（条）' : '该方面评价内的比例'}</h3>
              <ReviewChart scope={gameId} name={name} rows={rows} mode={mode} />
            </Flex>)}
          </Flex>
        </Flex>
      </Flex>
    </PageLayout>
  </Section>;
}
