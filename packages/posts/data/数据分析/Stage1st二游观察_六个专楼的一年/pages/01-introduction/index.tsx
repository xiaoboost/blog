import { Box, Center, Section } from '@blog/mdx-slide';
import React from 'react';
import { pagePadding } from '../constants';
import { PageTitle } from '../../components/page-title';
import sharedStyles from '../shared.jss';
import styles from './style.jss';

export function Introduction() {
  const c = styles.classes;
  const s = sharedStyles.classes;
  return (
    <Section title="Stage1st：六个专楼的一年" className={s.page}>
      <Center padding={pagePadding}>
        <Box width="100%" padding="0 0 25px" className={c.introCopy}>
          <p className={`${s.eyebrow} ${c.eyebrow}`}>Stage1st 二游观察</p>
          <PageTitle as="h1">六个专楼的<span className={c.accent}>一年</span></PageTitle>
          <p className={c.lead}>更新时的热闹，平日里的闲聊<br />十万条回复里，这里的玩家都在聊些什么？</p>
        </Box>
      </Center>
    </Section>
  );
}
