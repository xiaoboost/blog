import { Box, TitleLabel, Flex, Section } from '@blog/mdx-slide';
import React from 'react';
import styles from '../deck.jss';

export function Columns() {
  const title = '一边叙述，一边展开。';
  const introTitle = '用比例组织内容';
  const spaceTitle = '间距，也是内容的一部分。';
  const balanceTitle = '让页面有轻重。';

  return (
    <Section className={styles.classes.page}>
      <Flex direction="column" height="100%" padding={120} gap={72}>
        <Box>
          <TitleLabel className={styles.classes.titleLabel} marginBottom={27}>LAYOUT STUDIES / 02</TitleLabel>
          <h2>{title}</h2>
        </Box>
        <Flex flex="fill" gap={72}>
          <Flex flex={2} direction="column" justify="center" gap={36}>
            <h3>{introTitle}</h3>
            <p>文字需要呼吸，信息需要层次。<br />把重要的内容留在宽的一侧。</p>
            <p className={styles.classes.note}>Flex 的两列按 2 : 3 分配空间；<br />Box 用 padding、radius 和 border 描述外观。</p>
          </Flex>
          <Flex flex={3} direction="column" gap={24}>
            <Box flex="fill" className={styles.classes.panel}>
              <TitleLabel className={styles.classes.titleLabel} marginBottom={27}>01 / SPACE</TitleLabel>
              <h3>{spaceTitle}</h3>
              <p className={styles.classes.note}>相邻元素的节奏，由 gap 统一控制。</p>
            </Box>
            <Box flex="fill" padding={39} radius={18} border={{ thickness: 1.5, pattern: 'dashed' }}>
              <TitleLabel className={styles.classes.titleLabel} marginBottom={27}>02 / BALANCE</TitleLabel>
              <h3>{balanceTitle}</h3>
              <p className={styles.classes.note}>固定、填满、按比例，占据合适的空间。</p>
            </Box>
          </Flex>
        </Flex>
      </Flex>
    </Section>
  );
}
