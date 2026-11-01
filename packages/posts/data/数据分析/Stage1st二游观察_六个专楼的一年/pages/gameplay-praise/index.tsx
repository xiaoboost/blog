import { GameplayReviews } from '../../components/gameplay-reviews';
import { sentimentColors } from '../../components/content-analysis/constants';
import { categories, praiseColumns, quotes } from './data';
import { categoryDescriptions } from './descriptions';

export function GameplayPraise() {
  return <GameplayReviews
    title="玩法得到称赞，大家在夸什么？"
    subtitle="六楼合并来看，玩法是讨论最多的话题，也承载了最多的称赞与抱怨。"
    label="玩法正面细分：六楼合并与六个游戏"
    color={sentimentColors.positive}
    categories={categories} columns={praiseColumns} descriptions={categoryDescriptions} quotes={quotes}
  />;
}
