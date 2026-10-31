import { Chart, Group, Pie, scaleLinear } from '@blog/mdx-chart';
import { Box, Flex, Grid, Section } from '@blog/mdx-slide';
import React from 'react';
import { contentGap, pagePadding } from '../constants';
import sharedStyles from '../shared.jss';
import { gameStatistics, totalReplies, uniqueAccounts, formatNumber } from './data';
import styles from './style.jss';

export function Overview() {
  const c = styles.classes;
  const s = sharedStyles.classes;
  const x = scaleLinear({ domain: [0, 900], range: [0, 590] });
  return (
    <Section title="回复量与发言人数" className={s.page}>
      <Flex direction="column" height="100%" padding={pagePadding} gap={0}>
        <Box flex="fixed">
          <p className={s.eyebrow}>先看规模</p>
          <h2>聊了多少条，又有多少人在聊？</h2>
        </Box>
        <Grid columns={2} gap={60} height="auto" flex="fixed" margin={`${contentGap}px 0 0`}>
          <Box minWidth={0}>
            <h3>回复量的分布</h3><p className={c.chartCaption}>每条回复只属于一个专楼</p>
            <Grid columns="400px minmax(0, 1fr)" gap={24} align="center" height={500}>
              <Chart width={400} height={500} role="img" aria-label={`六楼共 ${formatNumber(totalReplies)} 条回复，各楼份额见旁边图例`}>
                <Group top={250} left={200}>
                  <Pie data={gameStatistics} pieValue={d => d.replies} innerRadius={130} outerRadius={190} padAngle={0.025} pieSort={null}>
                    {pie => pie.arcs.map(arc => <path key={arc.data.id} d={pie.path(arc) ?? ''} fill={arc.data.color}><title>{`${arc.data.name}：${formatNumber(arc.data.replies)} 条，${(arc.data.replies / totalReplies * 100).toFixed(1)}%`}</title></path>)}
                  </Pie>
                  <text textAnchor="middle" y={0} fill="currentColor" fontSize={48} fontWeight={600}>{formatNumber(totalReplies)}</text>
                  <text textAnchor="middle" y={44} fill="currentColor" fontSize={26}>条回复</text>
                </Group>
              </Chart>
              <ul className={c.legend}>{gameStatistics.map(g => (
                <li key={g.id}>
                  <Grid columns="minmax(0, 1fr) 136px 76px" gap={12} align="center" height="auto" padding="18px 0">
                    <span><i className={c.dot} style={{ background: g.color }} />{g.name}</span>
                    <strong className={c.legendCount}>{formatNumber(g.replies)} 条</strong>
                    <span className={c.legendShare}>{(g.replies / totalReplies * 100).toFixed(1)}%</span>
                  </Grid>
                </li>
              ))}</ul>
            </Grid>
            <p className={c.chartFootnote}>六楼合计 {formatNumber(totalReplies)} 条回复。</p>
          </Box>
          <Box minWidth={0}>
            <h3>各楼的发言账号</h3><p className={c.chartCaption}>同一账号可以参与多个专楼</p>
            <Chart width={830} height={500} role="img" aria-label="各楼发言账号数：原神272、星穹铁道346、绝区零278、明日方舟361、终末地812、鸣潮607">
              {[0, 300, 600, 900].map(n => <g key={n}><line x1={160 + x(n)} x2={160 + x(n)} y1={20} y2={470} stroke="currentColor" opacity={0.1} /><text x={160 + x(n)} y={492} textAnchor="middle" fill="currentColor" opacity={0.65} fontSize={23}>{n}</text></g>)}
              {gameStatistics.map((g, i) => <g key={g.id} transform={`translate(0,${30 + i * 78})`}>
                <text x={140} y={29} textAnchor="end" fill="currentColor" fontSize={28}>{g.name}</text>
                <rect x={160} y={0} width={x(g.accounts)} height={42} rx={3} fill={g.color} />
                <text x={174 + x(g.accounts)} y={30} fill="currentColor" fontSize={29}>{g.accounts}</text>
              </g>)}
            </Chart>
            <p className={c.chartFootnote}>六楼合计有 {formatNumber(uniqueAccounts)} 个不同账号。</p>
          </Box>
        </Grid>
      </Flex>
    </Section>
  );
}
