import {
  AxisBottom,
  AxisLeft,
  Chart,
  GridRows,
  Group,
  LinePath,
  scaleLinear,
} from '@blog/mdx-chart';
import React from 'react';

const data = [
  { day: 1, count: 120 },
  { day: 2, count: 280 },
  { day: 3, count: 190 },
  { day: 4, count: 420 },
  { day: 5, count: 350 },
  { day: 6, count: 240 },
  { day: 7, count: 310 },
];

export function DiscussionChart() {
  const width = 720;
  const height = 360;
  const margin = {
    top: 24,
    right: 24,
    bottom: 48,
    left: 56,
  };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const x = scaleLinear({ domain: [1, 7], range: [0, innerWidth] });
  const y = scaleLinear({ domain: [0, 500], range: [innerHeight, 0] });

  return (
    <Chart
      width={width}
      height={height}
      role="img"
      aria-label="七天讨论量折线图，参考值为 250 条"
    >
      <title>七天讨论量</title>
      <desc>演示数据：第 1 天 120 条，第 4 天达到最高值 420 条，第 7 天为 310 条。</desc>
      <Group left={margin.left} top={margin.top}>
        <GridRows
          scale={y}
          width={innerWidth}
          numTicks={5}
          stroke="currentColor"
          opacity={0.12}
        />
        <AxisBottom
          scale={x}
          top={innerHeight}
          tickValues={data.map(({ day }) => day)}
          tickFormat={(day) => `第 ${day} 天`}
          stroke="currentColor"
          tickStroke="currentColor"
          tickLabelProps={{ fill: 'currentColor', fontSize: 14, textAnchor: 'middle' }}
        />
        <AxisLeft
          scale={y}
          numTicks={5}
          stroke="currentColor"
          tickStroke="currentColor"
          tickLabelProps={{
            fill: 'currentColor',
            fontSize: 14,
            textAnchor: 'end',
            dy: '0.33em',
          }}
        />
        <LinePath
          data={data}
          x={(d) => x(d.day)}
          y={() => y(250)}
          stroke="currentColor"
          strokeDasharray="6 4"
          opacity={0.5}
          data-series="reference"
        />
        <LinePath
          data={data}
          x={(d) => x(d.day)}
          y={(d) => y(d.count)}
          stroke="#3b82f6"
          strokeWidth={2.5}
          data-series="daily"
        />
        {data.map((d) => (
          <circle
            key={d.day}
            cx={x(d.day)}
            cy={y(d.count)}
            r={3.5}
            fill="#3b82f6"
          />
        ))}
      </Group>
    </Chart>
  );
}
