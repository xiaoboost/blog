import { AxisLeft, Bar, BarStackHorizontal, Chart, GridColumns, Group, scaleBand, scaleLinear } from '@blog/mdx-chart';
import { Box, Eyebrow, Flex, Section, PageLayout } from '@blog/mdx-slide';
import { contentGap } from '../constants';
import { PageTitle } from '../../components/page-title';
import { formatNumber } from '../data';
import sharedStyles from '../shared.jss';
import { contributionGroups, contributionKeys, contributions, formatShare } from './data';
import styles from './style.jss';

function ContributionChart() {
  const plotHeight = 580;
  const x = scaleLinear({ domain: [0, 1], range: [0, 1220] });
  const y = scaleBand({ domain: contributions.map(game => game.name), range: [0, plotHeight], paddingInner: 0.24 });
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  return (
    <Chart width={1720} height={plotHeight + 120} className={styles.classes.chart} role="img" aria-label="六楼回复贡献：回复最多的10个账号与其他账号的回复数及占比，右侧为各楼发言账号总数">
      <text x={180} y={30} fill="currentColor" opacity={0.65} fontSize={23}>回复数 · 占本楼比例</text>
      <text x={1640} y={30} textAnchor="middle" fill="currentColor" opacity={0.65} fontSize={23}>发言账号总数</text>
      <Group left={180} top={60}>
        <GridColumns scale={x} tickValues={ticks} top={-8} height={plotHeight + 16} stroke="currentColor" strokeOpacity={0.08} />
        <AxisLeft
          scale={y} left={-24} hideAxisLine hideTicks tickLength={0}
          tickLabelProps={{ fill: 'currentColor', fontFamily: 'inherit', fontSize: 29, dx: 0, dy: '0.333em' }}
        />
        <BarStackHorizontal
          data={contributions} keys={[...contributionKeys]} y={game => game.name}
          xScale={x} yScale={y} offset="expand" color={(_, index) => contributions[index].color}
        >
          {stacks => stacks.map(stack => stack.bars.map(bar => {
            const game = bar.bar.data;
            const group = contributionGroups[stack.key];
            const count = game[stack.key];
            const label = `${formatNumber(count)} 条 · ${formatShare(count, game.replies)}`;
            return (
              <Group key={`${game.id}-${stack.key}`} left={bar.x} top={bar.y}>
                <Bar width={bar.width} height={bar.height} fill={bar.color} fillOpacity={group.opacity} />
                <text x={bar.width / 2} y={bar.height / 2 + 9} textAnchor="middle" fill="currentColor" fontSize={27} fontWeight={500}>{label}</text>
                <title>{`${game.name} · ${group.label}：${label}；本楼共 ${formatNumber(game.replies)} 条回复`}</title>
              </Group>
            );
          }))}
        </BarStackHorizontal>
        {contributions.map(game => (
          <text key={game.id} x={1460} y={y(game.name)! + y.bandwidth() / 2 + 10} textAnchor="middle" fill="currentColor" fontSize={31}>
            {formatNumber(game.accounts)}<tspan fontSize={22}> 个</tspan>
          </text>
        ))}
      </Group>
    </Chart>
  );
}

export function Concentration() {
  const c = styles.classes;
  const s = sharedStyles.classes;
  return (
    <Section title="前十账号的回复贡献" className={s.page}>
      <PageLayout>
        <Flex direction="column" height="100%" gap={0}>
          <Box flex="fixed">
            <Eyebrow>再看发言者</Eyebrow>
            <PageTitle>一个专楼的讨论，由多少人撑起来？</PageTitle>
          </Box>
          <Flex direction="column" justify="space-between" gap={0} flex="fill" margin={`${contentGap}px 0 0`}>
            <Flex align="center" gap={48} flex="fixed" className={c.legend}>
              {contributionKeys.map(key => (
                <Flex key={key} align="center" gap={14}>
                  <Chart width={30} height={20} className={c.swatch} aria-hidden="true">
                    <Bar width={30} height={20} rx={2} fill="currentColor" fillOpacity={contributionGroups[key].opacity} />
                  </Chart>
                  <span>{contributionGroups[key].label}</span>
                </Flex>
              ))}
            </Flex>
            <ContributionChart />
            <Box flex="fixed" className={c.summary}>
              <p>原神楼前 10 个账号贡献了 <strong>57.7%</strong> 的回复，超过一半。</p>
            </Box>
          </Flex>
        </Flex>
      </PageLayout>
    </Section>
  );
}
