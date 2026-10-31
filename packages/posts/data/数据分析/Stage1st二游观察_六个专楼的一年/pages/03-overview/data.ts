import { games, type GameId } from '../data';

const statistics = {
  genshin: { replies: 21121, accounts: 272 },
  starRail: { replies: 13436, accounts: 346 },
  zenless: { replies: 8154, accounts: 278 },
  arknights: { replies: 8686, accounts: 361 },
  endfield: { replies: 22851, accounts: 812 },
  wutheringWaves: { replies: 27781, accounts: 607 },
} satisfies Record<GameId, { replies: number; accounts: number }>;

export const gameStatistics = games.map(game => ({ ...game, ...statistics[game.id] }));
export const totalReplies = gameStatistics.reduce((sum, game) => sum + game.replies, 0);
export const uniqueAccounts = 1729;
export const formatNumber = (n: number) => n.toLocaleString('zh-CN');
