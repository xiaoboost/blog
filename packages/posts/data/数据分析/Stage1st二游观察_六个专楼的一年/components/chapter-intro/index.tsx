import { Box, Flex, Section, PageLayout } from '@blog/mdx-slide';
import { PageTitle } from '../page-title';
import { games } from '../../pages/data';
import sharedStyles from '../../pages/shared.jss';
import styles from './style.jss';

interface ChapterIntroProps {
  label: string;
  title: string;
  paragraphs: readonly string[];
}

export function ChapterIntro({ label, title, paragraphs }: ChapterIntroProps) {
  const c = styles.classes;
  const s = sharedStyles.classes;
  return (
    <Section title={title} className={s.page}>
      <PageLayout>
        <Flex direction="column" justify="center" height="100%" gap={0}>
          <Box width="100%" className={c.content}>
            <Flex align="center" gap={28} className={c.chapterLabel}>
              <p>{label}</p>
              <Flex gap={9} aria-hidden="true">
                {games.map(game => <Box key={game.id} width={40} height={4} flex="fixed" background={game.color} />)}
              </Flex>
            </Flex>
            <PageTitle className={c.title}>{title}</PageTitle>
            <Flex direction="column" gap={6} className={c.description}>
              {paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
            </Flex>
          </Box>
        </Flex>
      </PageLayout>
    </Section>
  );
}
