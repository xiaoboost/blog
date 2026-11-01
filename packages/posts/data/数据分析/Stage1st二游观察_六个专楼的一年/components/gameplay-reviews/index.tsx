import { Box, Eyebrow, Flex, Section, PageLayout } from '@blog/mdx-slide';
import { contentGap } from '../../pages/constants';
import { games, type GameId } from '../../pages/data';
import sharedStyles from '../../pages/shared.jss';
import { PageTitle } from '../page-title';
import { TopicMatrix } from '../content-analysis';
import type { MatrixColumn } from '../content-analysis/types';
import styles from './style.jss';

interface GameplayReviewsProps {
  title: string;
  subtitle: string;
  label: string;
  color: string;
  categories: readonly string[];
  columns: readonly MatrixColumn[];
  descriptions: Readonly<Record<string, string>>;
  quotes: readonly { gameId: GameId; pid: number; tid: number; categories: readonly string[]; text: string; date: string }[];
}

export function GameplayReviews({ title, subtitle, label, color, categories, columns, descriptions, quotes }: GameplayReviewsProps) {
  return <Section title={title} className={sharedStyles.classes.page}>
    <PageLayout>
      <Flex direction="column" height="100%" gap={0}>
        <Box flex="fixed">
          <Eyebrow>大家在聊什么</Eyebrow>
          <PageTitle>{title}</PageTitle>
          <p className={styles.classes.subtitle}>{subtitle}</p>
        </Box>
        <Flex direction="column" flex="fill" justify="space-between" margin={`${contentGap}px 0 0`} gap={0}>
          <TopicMatrix label={label} rows={categories} columns={columns}
            height={600} color={color} maximum={0.65} descriptions={descriptions} />
          <Flex align="start" justify="space-between" gap={0} flex="fixed" data-gameplay-quotes>
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
    </PageLayout>
  </Section>;
}
