import { accountCounts, games, replyCounts } from '../data';

export { uniqueAccounts, formatNumber } from '../data';

export const gameStatistics = games.map(game => ({ ...game, replies: replyCounts[game.id], accounts: accountCounts[game.id] }));
export const totalReplies = gameStatistics.reduce((sum, game) => sum + game.replies, 0);
