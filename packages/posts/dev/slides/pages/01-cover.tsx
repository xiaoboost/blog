import { useFontText } from '@blog/context/runtime';
import { Box, Center, Section } from '@blog/mdx-slide';
import { PrimaryTitleFont } from '@blog/styles';
import React from 'react';
import styles from '../deck.jss';

export function Cover() {
  const title = '留白之间';
  useFontText(PrimaryTitleFont.fontFamily, title);

  return (
    <Section className={styles.classes.page}>
      <Center padding={120}>
        <Box style={{ textAlign: 'center' }}>
          <p className={styles.classes.eyebrow}>LAYOUT STUDIES / 01</p>
          <h1>{title}</h1>
          <p className={styles.classes.subtitle}>让内容，找到自己的位置。</p>
          <div className={styles.classes.rule} />
          <p className={styles.classes.note}>Center · Box</p>
          <p className={styles.classes.note}>使用 ← → 或点击画面翻页</p>
        </Box>
      </Center>
    </Section>
  );
}
