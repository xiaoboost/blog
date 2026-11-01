import { accountCounts, games, uniqueAccounts, type GameId } from '../data';

// Frozen aggregates from draft/二游论坛观察/materials/data/summary.json.
// Each pair counts UIDs that posted in both threads during the observation year.
const sharedAccounts = [
  ['genshin', 'starRail', 136],
  ['genshin', 'zenless', 112],
  ['genshin', 'arknights', 18],
  ['genshin', 'endfield', 72],
  ['genshin', 'wutheringWaves', 45],
  ['starRail', 'zenless', 132],
  ['starRail', 'arknights', 28],
  ['starRail', 'endfield', 96],
  ['starRail', 'wutheringWaves', 68],
  ['zenless', 'arknights', 27],
  ['zenless', 'endfield', 109],
  ['zenless', 'wutheringWaves', 71],
  ['arknights', 'endfield', 234],
  ['arknights', 'wutheringWaves', 53],
  ['endfield', 'wutheringWaves', 178],
] satisfies [GameId, GameId, number][];

export const overlapRows = games.map(game => ({
  ...game,
  accounts: accountCounts[game.id],
  cells: games.map(other => {
    if (game.id === other.id) return null;
    const pair = sharedAccounts.find(([a, b]) => (
      (a === game.id && b === other.id) || (a === other.id && b === game.id)
    ));
    if (!pair) throw new Error(`Missing overlap: ${game.id}, ${other.id}`);
    return { shared: pair[2], share: pair[2] / accountCounts[game.id] };
  }),
}));

// HeatmapRect 按列接收数据；每格比例仍以原来的行账号数为分母。
export const overlapColumns = games.map((game, column) => ({
  ...game,
  bins: overlapRows.map(row => ({
    source: row.name,
    accounts: row.accounts,
    cell: row.cells[column],
  })),
}));

export const participation = [
  { threads: 1, accounts: 1084 },
  { threads: 2, accounts: 441 },
  { threads: 3, accounts: 133 },
  { threads: 4, accounts: 49 },
  { threads: 5, accounts: 17 },
  { threads: 6, accounts: 5 },
].map(row => ({ ...row, share: row.accounts / uniqueAccounts }));

export const multiThreadAccounts = participation
  .filter(row => row.threads > 1)
  .reduce((total, row) => total + row.accounts, 0);

export const formatPercent = (n: number) => `${(n * 100).toFixed(1)}%`;
export const heatmapMaximum = 0.7;
