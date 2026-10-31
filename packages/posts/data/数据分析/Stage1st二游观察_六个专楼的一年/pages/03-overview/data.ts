import { accountCounts, games, type GameId } from '../data';

export { uniqueAccounts, formatNumber } from '../data';

const statistics = {
  genshin: { replies: 21121 },
  starRail: { replies: 13436 },
  zenless: { replies: 8154 },
  arknights: { replies: 8686 },
  endfield: { replies: 22851 },
  wutheringWaves: { replies: 27781 },
} satisfies Record<GameId, { replies: number }>;

export const gameStatistics = games.map(game => ({ ...game, ...statistics[game.id], accounts: accountCounts[game.id] }));
export const totalReplies = gameStatistics.reduce((sum, game) => sum + game.replies, 0);
