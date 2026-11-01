import { useFontText } from '@blog/context/runtime';
import { Background, Box, Eyebrow, Place, Section } from '@blog/mdx-slide';
import { PrimaryTitleFont } from '@blog/styles';
import React from 'react';
import landscape from '../landscape.svg';
import common from '../deck.jss';
import styles from './04-place.jss';

export function Composition() {
  const title = ['不必总是', '整齐排列。'];
  useFontText(PrimaryTitleFont.fontFamily, ...title);

  return (
    <Section className={`${common.classes.page} ${styles.classes.page}`}>
      <Background src={landscape} overlay="linear-gradient(90deg, rgba(12,29,34,.7), transparent)" />
      <Place x={120} y={120}>
        <Eyebrow className={common.classes.eyebrow} marginBottom={27}>LAYOUT STUDIES / 04</Eyebrow>
      </Place>
      <Place x={120} y={337.5} width={1050}>
        <h1>{title[0]}<br />{title[1]}</h1>
        <p className={styles.classes.caption}>偶尔，让一个想法自由落下。</p>
      </Place>
      <Place x={1350} y={255} width={330} height={420} zIndex={1}>
        <Box className={styles.classes.annotation} height="100%" padding={42} radius={15}>
          <p>自由构图</p>
          <p className={styles.classes.caption}>背景铺满画布；<br />文字与注释，<br />各有自己的坐标。</p>
        </Box>
      </Place>
      <Place x={120} y={900}>
        <p className={styles.classes.caption}>Place · Background · 本页独立样式</p>
      </Place>
    </Section>
  );
}
