import { describe, expect, it } from '@blog/test-toolkit';
import React from 'react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import {
  AxisBottom,
  AxisLeft,
  Bar,
  Chart,
  GridRows,
  Group,
  HeatmapRect,
  LinePath,
  scaleLinear,
} from '..';

describe('静态 SVG 图表', () => {
  it('热力图支持静态输出，并把行列、颜色和尺寸交给自定义标签图层', () => {
    const data = [
      { bins: [{ count: 100 }, { count: 25 }] },
      { bins: [{ count: 50 }, { count: 200 }] },
    ];
    const props = {
      data,
      bins: (column: typeof data[number]) => column.bins,
      count: (bin: typeof data[number]['bins'][number]) => bin.count,
      xScale: (column: number) => column * 60,
      yScale: (row: number) => row * 40,
      binWidth: 60,
      binHeight: 40,
      gap: 4,
      colorScale: () => 'teal',
    };
    for (const render of [renderToStaticMarkup, renderToString]) {
      const plain = render(<Chart width={120} height={80}><HeatmapRect {...props} /></Chart>);
      expect(plain.match(/class="visx-heatmap-rect"/g)).length(4);
      expect(plain).include('width="56"').include('height="36"').include('fill="teal"');

      const labelled = render(
        <Chart width={120} height={80}>
          <HeatmapRect {...props}>
            {(columns) => columns.map((column) => column.map((cell) => (
              <Group key={`${cell.column}-${cell.row}`} left={cell.x} top={cell.y}>
                <Bar width={cell.width} height={cell.height} fill={cell.color} />
                <text>{`${cell.row},${cell.column}: ${cell.bin.count}`}</text>
              </Group>
            )))}
          </HeatmapRect>
        </Chart>,
      );
      expect(labelled.match(/class="visx-bar"/g)).length(4);
      expect(labelled).include('translate(60, 4)').include('0,1: 50').include('1,0: 25');
      expect(labelled).not.match(/<script\b|NaN|Infinity/);
    }
  });

  it('原生 visx 折线、网格和坐标轴在服务端直接生成完整 SVG', () => {
    const data = [{ x: 0, y: 0 }, { x: 1, y: 10 }, { x: 2, y: 5 }];
    const x = scaleLinear({ domain: [0, 2], range: [0, 200] });
    const y = scaleLinear({ domain: [0, 10], range: [100, 0] });
    const chart = (
      <Chart
        width={260}
        height={160}
        role="img"
        aria-label="讨论量"
      >
        <title>讨论量</title>
        <Group left={40} top={20}>
          <GridRows scale={y} width={200} numTicks={3} />
          <AxisBottom
            scale={x}
            top={100}
            tickValues={[0, 1, 2]}
            tickFormat={(value) => `第${value}天`}
          />
          <AxisLeft scale={y} tickValues={[0, 5, 10]} />
          <LinePath
            data={data}
            x={(d) => x(d.x)}
            y={(d) => y(d.y)}
            stroke="blue"
          />
        </Group>
      </Chart>
    );

    // 同时覆盖独立 SVG 导出与博客现有的整页渲染方式。
    for (const render of [renderToStaticMarkup, renderToString]) {
      const svg = render(chart);
      expect(svg).include('xmlns="http://www.w3.org/2000/svg"').include('viewBox="0 0 260 160"');
      expect(svg).include('d="M0,100L100,0L200,50"').include('visx-rows');
      expect(svg).include('第0天').include('第1天').include('第2天');
      expect(svg).include('<title>讨论量</title>').include('aria-label="讨论量"');
      expect(svg).not.match(/<script\b|NaN|Infinity/);
    }
  });

  it('允许自定义 viewBox、样式和 SVG 图层，不接管原组件的配置', () => {
    const svg = renderToStaticMarkup(
      <Chart
        width={300}
        height={200}
        viewBox="-10 -20 600 400"
        className="custom-chart"
        style={{ maxWidth: 'none', height: 240, background: '#fff' }}
      >
        <defs>
          <linearGradient id="chart-gradient">
            <stop offset="0%" stopColor="red" />
            <stop offset="100%" stopColor="blue" />
          </linearGradient>
        </defs>
        <LinePath
          data={[{ x: 0, y: 0 }, { x: 10, y: 20 }]}
          x={(d) => d.x}
          y={(d) => d.y}
          stroke="url(#chart-gradient)"
          strokeDasharray="4 2"
          data-series="custom"
        />
      </Chart>,
    );
    expect(svg).include('viewBox="-10 -20 600 400"').include('class="custom-chart"');
    expect(svg).include('max-width:none').include('height:240px');
    expect(svg).include('<linearGradient').include('stroke="url(#chart-gradient)"');
    expect(svg).include('stroke-dasharray="4 2"').include('data-series="custom"');
  });
});
