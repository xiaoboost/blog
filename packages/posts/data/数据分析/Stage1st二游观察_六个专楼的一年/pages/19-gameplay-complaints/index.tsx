import { Box, Flex, Section } from '@blog/mdx-slide';
import React from 'react';
import { contentGap, pagePadding } from '../constants';
import { PageTitle } from '../../components/page-title';
import { TopicMatrix } from '../../components/content-analysis';
import { sentimentColors } from '../../components/content-analysis/constants';
import contentStyles from '../../components/content-analysis/style.jss';
import { games } from '../data';
import sharedStyles from '../shared.jss';
import { categories, complaintColumns, quotes } from './data';
import { categoryDescriptions } from './descriptions';
import styles from './style.jss';

export function GameplayComplaints() {
  return <Section title="都在抱怨玩法，抱怨的是同一件事吗？" className={sharedStyles.classes.page}>
    <Flex direction="column" height="100%" padding={pagePadding} gap={0}>
      <Box flex="fixed"><p className={sharedStyles.classes.eyebrow}>大家在聊什么</p><PageTitle>都在抱怨玩法，抱怨的是同一件事吗？</PageTitle></Box>
      <Flex direction="column" flex="fill" justify="space-between" margin={`${contentGap}px 0 0`} gap={0}>
        <p className={contentStyles.classes.note}>占该楼玩法负面帖子的比例；一帖可涉及多类</p>
        <TopicMatrix label="玩法负面细分：六楼合并与六个游戏" rows={categories} columns={complaintColumns}
          height={548} color={sentimentColors.negative} maximum={0.65} descriptions={categoryDescriptions} />
        <Flex align="start" justify="space-between" gap={0} flex="fixed">
          {quotes.map(quote => {
            const game = games.find(item => item.id === quote.gameId)!;
            return <Flex key={quote.pid} direction="column" gap={10} className={styles.classes.quote} style={{ borderColor: game.color }}>
              <p className={styles.classes.source}><a href={`https://stage1st.com/2b/forum.php?mod=redirect&goto=findpost&ptid=${quote.tid}&pid=${quote.pid}`} target="_blank" rel="noreferrer">{game.name} · {quote.categories.join(' / ')} · {quote.date}</a></p>
              <p className={styles.classes.excerpt}>“{quote.text}”</p>
            </Flex>;
          })}
        </Flex>
      </Flex>
    </Flex>
  </Section>;
}
