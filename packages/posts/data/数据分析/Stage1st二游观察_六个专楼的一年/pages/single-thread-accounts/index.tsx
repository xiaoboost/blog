import { AxisBottom, AxisLeft, Bar, Chart, GridColumns, Group, scaleBand, scaleLinear } from '@blog/mdx-chart';
import { Box, Eyebrow, Flex, Section, PageLayout } from '@blog/mdx-slide';
import { PageTitle } from '../../components/page-title';
import { contentGap } from '../constants';
import { formatNumber } from '../data';
import sharedStyles from '../shared.jss';
import { accountRows, type AccountRow } from './data';
import styles from './style.jss';

function AccountChart({ rows, total, active, proportion }: {
  rows: AccountRow[];
  total: number;
  active: boolean;
  proportion: boolean;
}) {
  const maximum = proportion ? 1 : active ? 160 : 400;
  const plotHeight = 480;
  const x = scaleLinear({ domain: [0, maximum], range: [0, 420] });
  const y = scaleBand({ domain: rows.map(g => g.name), range: [0, plotHeight], paddingInner: 0.4 });
  const ticks = proportion ? [0, 0.25, 0.5, 0.75, 1] : active ? [0, 40, 80, 120, 160] : [0, 100, 200, 300, 400];
  const label = (g: AccountRow) => proportion
    ? `${(g.single / g.eligible * 100).toFixed(1)}% (${g.single}/${g.eligible})`
    : `${g.single} (${(g.single / total * 100).toFixed(1)}%)`;
  return (
    <Chart width={830} height={plotHeight + 78} role="img" aria-label={rows.map(g => `${g.name}：${label(g)}`).join('；')}>
      <Group left={160} top={30}>
        <GridColumns scale={x} tickValues={ticks} top={-10} height={plotHeight + 18} stroke="currentColor" strokeOpacity={0.1} />
        <AxisBottom scale={x} top={plotHeight + 17} tickValues={ticks} hideAxisLine hideTicks tickLength={0}
          tickFormat={v => proportion ? `${Number(v) * 100}%` : String(v)}
          tickLabelProps={{ fill: 'currentColor', opacity: 0.65, fontFamily: 'inherit', fontSize: 23, dy: 0 }} />
        <AxisLeft scale={y} left={-20} hideAxisLine hideTicks tickLength={0}
          tickLabelProps={{ fill: 'currentColor', fontFamily: 'inherit', fontSize: 28, dx: 0, dy: 8 }} />
        {rows.map(g => (
          <Group key={g.id} top={y(g.name)}>
            <Bar width={x(proportion ? g.single / g.eligible : g.single)} height={y.bandwidth()} rx={3} fill={g.color} />
            <text x={12 + x(proportion ? g.single / g.eligible : g.single)} y={y.bandwidth() / 2 + 8} fill="currentColor" fontSize={24}>{label(g)}</text>
          </Group>
        ))}
      </Group>
    </Chart>
  );
}

export function SingleThreadPage({ active = false }: { active?: boolean }) {
  const rows = accountRows(active);
  const total = active ? 356 : 1084;
  const eligible = active ? 924 : 1729;
  const c = styles.classes;
  return (
    <Section id={active ? 'single-thread-active' : 'single-thread-accounts'} title={active ? '至少回复五条的单楼账号' : '单楼账号的分布'} className={sharedStyles.classes.page}>
      <PageLayout>
        <Flex direction="column" justify="space-between" height="100%" gap={contentGap}>
          <Box flex="fixed">
            <Eyebrow>{active ? '提高回复门槛' : '再看单楼账号'}</Eyebrow>
            <PageTitle>{active ? '至少回复五条后，单楼账号分布在哪里？' : '只在一个专楼发言的账号，分布在哪里？'}</PageTitle>
            <p className={c.summary}>{active ? '全年在六楼合计至少回复 5 条的账号中，' : '六个专楼的发言账号中，'}{formatNumber(total)} / {formatNumber(eligible)} 个（{(total / eligible * 100).toFixed(1)}%）只在一个楼发言。</p>
          </Box>
          <Flex gap={60} align="stretch" width="100%" flex="fixed">
            <Box flex={1}>
              <h3>这些单楼账号，分布在哪里？</h3>
              <p className={c.caption}>账号数；括号内占全部 {formatNumber(total)} 个单楼账号</p>
              <AccountChart rows={rows} total={total} active={active} proportion={false} />
            </Box>
            <Box flex={1}>
              <h3>各楼有多少账号只在本楼发言？</h3>
              <p className={c.caption}>单楼账号 ÷ 本楼{active ? '达到回复门槛的' : '全部发言'}账号</p>
              <AccountChart rows={rows} total={total} active={active} proportion />
            </Box>
          </Flex>
          <Box flex="fixed">
            <p className={c.footnote}>“单楼”只是发帖记录，并不是说他只玩一款游戏</p>
          </Box>
        </Flex>
      </PageLayout>
    </Section>
  );
}

export function SingleThreadAccounts() {
  return <SingleThreadPage />;
}
