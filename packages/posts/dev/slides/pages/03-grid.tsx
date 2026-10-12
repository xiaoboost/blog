import { Box, Flex, Grid, Section } from '@blog/mdx-slide';
import React from 'react';
import styles from '../deck.jss';

const ideas = [
  ['秩序', '同样的边界，让不同的内容保持连贯。'],
  ['节奏', '重复中有变化，页面才不会单调。'],
  ['留白', '少放一点，才能让重点被看见。'],
];

export function Gallery() {
  const heading = '在网格里，建立秩序。';

  return (
    <Section className={styles.classes.page}>
      <Flex direction="column" height="100%" padding={120} gap={72}>
        <Box>
          <p className={styles.classes.eyebrow}>LAYOUT STUDIES / 03</p>
          <h2>{heading}</h2>
        </Box>
        <Grid columns={3} rows={1} gap={36} flex="fill">
          {ideas.map(([title, text], index) => (
            <Flex key={title} direction="column" justify="space-between" className={styles.classes.panel}>
              <p className={styles.classes.number}>{`0${index + 1}`}</p>
              <Box>
                <h3>{title}</h3>
                <p className={styles.classes.note} style={{ marginTop: 24 }}>{text}</p>
              </Box>
            </Flex>
          ))}
        </Grid>
        <p className={styles.classes.note}>Grid · 三个等宽的区域，一个共同的节奏。</p>
      </Flex>
    </Section>
  );
}
