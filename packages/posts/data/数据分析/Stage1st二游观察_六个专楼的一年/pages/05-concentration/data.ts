import { accountCounts, games, replyCounts, type GameId } from '../data';

// Annual per-thread UID reply counts, sorted descending and summed over the top 10.
// Verified against the read-only archive database and materials/data/summary.json.
const top10Replies = {
  genshin: 12193,
  starRail: 5480,
  zenless: 3725,
  arknights: 3514,
  endfield: 8237,
  wutheringWaves: 8748,
} satisfies Record<GameId, number>;

export const contributionKeys = ['top10', 'others'] as const;
export const contributionGroups = {
  top10: { label: '回复最多的 10 个账号', opacity: 0.5 },
  others: { label: '其他账号', opacity: 0.14 },
};

export const contributions = games.map(game => ({
  ...game,
  accounts: accountCounts[game.id],
  replies: replyCounts[game.id],
  top10: top10Replies[game.id],
  others: replyCounts[game.id] - top10Replies[game.id],
}));

export const formatShare = (count: number, total: number) => `${(count / total * 100).toFixed(1)}%`;
