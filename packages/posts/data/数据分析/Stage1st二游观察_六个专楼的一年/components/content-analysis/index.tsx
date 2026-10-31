import { AxisLeft, Bar, Chart, Group, HeatmapRect, scaleBand, scaleLinear } from '@blog/mdx-chart';
import React from 'react';
import { formatNumber, games } from '../../pages/data';
import { formatPercent } from './constants';
import styles from './style.jss';
import type { MatrixColumn } from './types';

interface TopicMatrixProps {
  label: string;
  rows: readonly string[];
  columns: readonly MatrixColumn[];
  height: number;
  color: string;
  maximum: number;
  mutedFrom?: number;
  descriptions?: Readonly<Record<string, string>>;
}

export function TopicMatrix({ label, rows, columns, height, color, maximum, mutedFrom = rows.length, descriptions }: TopicMatrixProps) {
  const left = descriptions ? 360 : 240;
  const top = 88;
  const plotWidth = 1720 - left;
  const plotHeight = height - top - 4;
  const x = scaleBand({ domain: columns.map((_, i) => i), range: [0, plotWidth], paddingInner: 0.045 });
  const y = scaleBand({ domain: rows.map((_, i) => i), range: [0, plotHeight], paddingInner: 0.10 });
  const opacity = scaleLinear({ domain: [0, maximum], range: [0.045, 0.68], clamp: true });
  const data = columns.map(column => ({ ...column, bins: column.counts.map(count => ({ count, share: count / column.denominator })) }));
  return <Chart width={1720} height={height} className={styles.classes.chart} role="img" aria-label={label}>
    {columns.map((column, index) => {
      const game = games.find(item => item.id === column.id);
      const center = left + x(index)! + x.bandwidth() / 2;
      return <Group key={column.id}>
        <Bar x={center - 22} y={0} width={44} height={4} fill={game?.color ?? color} />
        <text x={center} y={34} textAnchor="middle" fill="currentColor" fontSize={29} fontWeight={500}>{game?.name ?? '六楼合并'}</text>
        <text x={center} y={65} textAnchor="middle" fill="currentColor" opacity={0.6} fontSize={21}>{formatNumber(column.denominator)} 条</text>
      </Group>;
    })}
    <Group left={left} top={top}>
      <AxisLeft scale={y} left={-20} hideAxisLine hideTicks tickLength={0}
        tickFormat={index => rows[index]}
        tickLabelProps={index => ({ fill: 'currentColor', opacity: Number(index) >= mutedFrom ? 0.55 : 1, fontFamily: 'inherit', fontSize: 26, textAnchor: 'end', dy: descriptions ? -5 : '0.333em' })} />
      {descriptions && rows.map((row, index) => <text key={row} data-category-description={row} x={-20} y={y(index)! + y.bandwidth() / 2 + 23}
        textAnchor="end" fill="currentColor" opacity={0.6} fontSize={19}>{descriptions[row]}</text>)}
      <HeatmapRect data={data} bins={column => column.bins} count={bin => bin.share}
        xScale={index => x(index)!} yScale={index => y(index)!}
        binWidth={x.bandwidth()} binHeight={y.bandwidth()} gap={0}
        colorScale={() => color} opacityScale={value => opacity(value)}>
        {cells => cells.map(column => column.map(cell => {
          const game = games.find(item => item.id === cell.datum.id);
          const muted = cell.row >= mutedFrom;
          return <Group key={`${cell.datum.id}-${cell.row}`} left={cell.x} top={cell.y}
            data-matrix-cell={`${cell.datum.id}:${rows[cell.row]}`} data-count={cell.bin.count} data-denominator={cell.datum.denominator}>
            <Bar width={cell.width} height={cell.height} rx={3} fill={muted ? 'currentColor' : cell.color} fillOpacity={muted ? 0.035 : cell.opacity} />
            <text x={cell.width / 2} y={cell.height / 2 + 9} textAnchor="middle" fill="currentColor" opacity={muted ? 0.6 : 1} fontSize={28} fontWeight={500}>{formatPercent(cell.bin.share)}</text>
            <title>{`${game?.name ?? '六楼合并'} · ${rows[cell.row]}：${formatNumber(cell.bin.count)} / ${formatNumber(cell.datum.denominator)} 条（${formatPercent(cell.bin.share)}）`}</title>
          </Group>;
        }))}
      </HeatmapRect>
    </Group>
  </Chart>;
}
