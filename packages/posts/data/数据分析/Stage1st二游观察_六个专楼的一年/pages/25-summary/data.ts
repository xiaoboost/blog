import { overlapRows } from '../05-overlap/data';
import { contributions } from '../06-concentration/data';
import { topicColumns } from '../21-topic-overview/data';
import { reviewData } from '../../components/aspect-reviews/data';
import { formatPercent, sentimentKeys, topics } from '../../components/content-analysis/constants';
import { games, replyCounts, uniqueAccounts } from '../data';
import { participationStages } from '../../components/participation/data';

const range = (values: number[]) => `${formatPercent(Math.min(...values))}–${formatPercent(Math.max(...values))}`;
const negativeRange = (topic: typeof topics[number]) => range(games.map(game => {
  const row = reviewData[game.id].find(item => item.topic === topic)!;
  return row.negative / sentimentKeys.reduce((sum, key) => sum + row[key], 0);
}));
const reachRange = (topic: typeof topics[number]) => range(topicColumns.map(column => column.counts[topics.indexOf(topic)] / column.denominator));
const mihoyoIds = ['genshin', 'starRail', 'zenless'];
const mihoyoRows = overlapRows.filter(row => mihoyoIds.includes(row.id));
const endfieldIndex = games.findIndex(game => game.id === 'endfield');
const contributionShare = (gameId: string) => {
  const row = contributions.find(item => item.id === gameId)!;
  return formatPercent(row.top10 / row.replies);
};

export const summaryFacts = {
  totalReplies: Object.values(replyCounts).reduce((sum, count) => sum + count, 0),
  accounts: uniqueAccounts,
  mihoyoInternalOverlap: range(mihoyoRows.flatMap(row => row.cells.flatMap((cell, index) => cell && mihoyoIds.includes(games[index].id) ? [cell.share] : []))),
  mihoyoToEndfield: range(mihoyoRows.map(row => row.cells[endfieldIndex]!.share)),
  genshinTop10: contributionShare('genshin'),
  wuwaTop10: contributionShare('wutheringWaves'),
  wuwaFirstObserved: ['3.0', '3.1'].map(label => participationStages.wutheringWaves.find(stage => stage.label === label)!.first),
  gameplayNegative: negativeRange('玩法与挑战'),
  communityReach: reachRange('社区与交流'),
  communityNegative: negativeRange('社区与交流'),
};

export const observations = [
  {
    label: '跨楼关系',
    title: '米家三楼有紧密的共同发言群',
    lead: `三楼两两的账号重合比例为 ${summaryFacts.mihoyoInternalOverlap}，与终末地也有 ${summaryFacts.mihoyoToEndfield} 的发言交集。`,
    detail: '米家内部联系更紧密，也存在跨到其他专楼的参与。',
  },
  {
    label: '发言结构',
    title: '高频发言者与新面孔共同参与',
    lead: `原神前十账号贡献 ${summaryFacts.genshinTop10} 的回复，鸣潮为 ${summaryFacts.wuwaTop10}；鸣潮 3.0 / 3.1 的“首次出现”账号分别有 ${summaryFacts.wuwaFirstObserved.join(' / ')} 个。`,
    detail: '原神楼更集中于高频账号，鸣潮这些版本则有较多新面孔。',
  },
  {
    label: '玩法与挑战',
    title: '至少在 S1，玩法是讨论的重心',
    lead: `玩法在六楼都是提及最多的话题；相关明确评价中，负面占 ${summaryFacts.gameplayNegative}。`,
    detail: '对这里的发言者而言，玩法体验是重要诉求。',
  },
  {
    label: '社区与交流',
    title: '话题份额不大，负面感受很集中',
    lead: `社区话题占各楼可分析帖子 ${summaryFacts.communityReach}；相关明确评价中，负面占 ${summaryFacts.communityNegative}。`,
    detail: '社区交流看起来是大家共同的困扰，二游苦社区环境久矣。',
  },
] as const;
