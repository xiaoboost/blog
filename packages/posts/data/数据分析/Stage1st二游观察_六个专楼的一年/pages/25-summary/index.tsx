import { Box, TitleLabel, Flex, Grid, Section } from '@blog/mdx-slide';
import { pagePadding } from '../constants';
import { PageTitle } from '../../components/page-title';
import { formatNumber } from '../data';
import sharedStyles from '../shared.jss';
import { observations, summaryFacts } from './data';
import styles from './style.jss';

function formatEvidence(text: string) {
  return text.split(/(\d+(?:\.\d+)?%–\d+(?:\.\d+)?%|\d+(?:\.\d+)? \/ \d+(?:\.\d+)?|“首次出现”)/).map((part, index) => (
    index % 2 ? <span key={index} className={styles.classes.keepTogether}>{part}</span> : part
  ));
}

export function Summary() {
  return <Section title="回看这一年" className={sharedStyles.classes.page}>
    <Flex direction="column" height="100%" padding={pagePadding} gap={0}>
      <Box flex="fixed"><TitleLabel>Stage1st 二游观察</TitleLabel></Box>
      <Flex align="end" justify="space-between" gap={40} flex="fixed">
        <PageTitle>回看这一年</PageTitle>
        <p className={styles.classes.totals}>六个专楼 · {formatNumber(summaryFacts.totalReplies)} 条回复 · {formatNumber(summaryFacts.accounts)} 个账号</p>
      </Flex>
      <Box flex="fixed" margin="26px 0 0" className={styles.classes.scope}>
        <p>这份观察反映的是 <strong>Stage1st 六个专楼发言者的讨论与偏好</strong>。</p>
        <p>它不代表全部玩家，也不能直接等同于游戏本身的内容构成或质量。</p>
      </Box>
      <Grid columns={2} rows={2} flex="fill" margin="30px 0 0" columnGap={64} rowGap={26}>
        {observations.map(observation => <Flex key={observation.label} direction="column" gap={12} minWidth={0} className={styles.classes.observation} data-summary-observation={observation.label}>
          <h3 className={styles.classes.title}>{observation.title}</h3>
          <p className={styles.classes.lead}>{formatEvidence(observation.lead)}</p>
          <p className={styles.classes.detail}>{observation.detail}</p>
        </Flex>)}
      </Grid>
    </Flex>
  </Section>;
}
