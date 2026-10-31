import { Box, TitleLabel, Flex, Grid, Section } from '@blog/mdx-slide';
import { contentGap, pagePadding } from '../constants';
import { PageTitle } from '../../components/page-title';
import sharedStyles from '../shared.jss';
import { threads, observation, formatDate } from './data';
import styles from './style.jss';

export function Scope() {
  const c = styles.classes;
  const s = sharedStyles.classes;
  return (
    <Section title="采集范围与统计口径" className={s.page}>
      <Flex direction="column" height="100%" padding={pagePadding} gap={0}>
        <Box flex="fixed">
          <TitleLabel>阅读说明</TitleLabel>
          <PageTitle>采集了什么，怎么统计？</PageTitle>
        </Box>
        <Grid columns={3} gap={60} height="auto" flex="fixed" margin={`${contentGap}px 0 0`}>
          <Flex direction="column" gap={28}>
            <h3 className={c.methodHeading}>为什么看专楼？</h3>
            <Flex direction="column" gap={24} className={c.reason}>
              <p>同一游戏的讨论集中在一个长期更新的帖子里，方便持续观察。</p>
              <p>回复有时间、账号和引用，便于统计，也能回看讨论脉络。</p>
            </Flex>
          </Flex>
          <Flex direction="column" gap={28}>
            <h3 className={c.methodHeading}>采集范围</h3>
            <Flex direction="column" gap={8} className={c.methodItem}>
              <p>Stage1st 手游页游版的六个主专楼：</p>
              <Grid columns={2} rows={3} columnGap={26} rowGap={8} height="auto" justify="start" className={c.threadLinks}>{threads.map(({ name, tid }) => (
                <a key={tid} href={`https://stage1st.com/2b/thread-${tid}-1-1.html`} target="_blank" rel="noreferrer">{name}</a>
              ))}</Grid>
            </Flex>
            <Flex direction="column" gap={8} className={c.methodItem}>
              <h4>覆盖时间</h4>
              <p>{formatDate(observation.start)} ~ {formatDate(observation.lastDay)}</p>
            </Flex>
          </Flex>
          <Flex direction="column" gap={28}>
            <h3 className={c.methodHeading}>统计口径</h3>
            <Flex direction="column" gap={8} className={c.methodItem}>
              <h4>回复数</h4>
              <p>按帖子 ID 去重；同账号的多条回复分别计数。</p>
            </Flex>
            <Flex direction="column" gap={8} className={c.methodItem}>
              <h4>发言账号数</h4>
              <p>只统计观察期内发过言的账号，按 UID 去重。</p>
            </Flex>
            <Flex direction="column" gap={8} className={c.methodItem}>
              <h4>跨楼合计</h4>
              <p>账号可参与多个专楼，合计人数再次去重。</p>
            </Flex>
          </Flex>
        </Grid>
        <Flex direction="column" justify="end" flex="fill" gap={0} padding="26px 0 0">
          <p className={c.methodNote}>本篇日期和每日统计均以北京时间为准。</p>
        </Flex>
      </Flex>
    </Section>
  );
}
