import { GameplayReviews } from '../../components/gameplay-reviews';
import { sentimentColors } from '../../components/content-analysis/constants';
import { categories, complaintColumns, quotes } from './data';
import { categoryDescriptions } from './descriptions';

export function GameplayComplaints() {
  return <GameplayReviews
    title="都在抱怨玩法，抱怨的是同一件事吗？"
    subtitle="多数专楼的抱怨集中在机制与配队，终末地则更常表达对玩法本身的不满。"
    label="玩法负面细分：六楼合并与六个游戏"
    color={sentimentColors.negative}
    categories={categories} columns={complaintColumns} descriptions={categoryDescriptions} quotes={quotes}
  />;
}
