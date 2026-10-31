// Shared game identities and consistent colors for every chart.
export const games = [
  { id: 'genshin', name: '原神', color: '#6686ad' },
  { id: 'starRail', name: '星穹铁道', color: '#9c85b1' },
  { id: 'zenless', name: '绝区零', color: '#c29459' },
  { id: 'arknights', name: '明日方舟', color: '#7e9873' },
  { id: 'endfield', name: '终末地', color: '#b97569' },
  { id: 'wutheringWaves', name: '鸣潮', color: '#579c99' },
] as const;

export type GameId = typeof games[number]['id'];

export const accountCounts = {
  genshin: 272,
  starRail: 346,
  zenless: 278,
  arknights: 361,
  endfield: 812,
  wutheringWaves: 607,
} satisfies Record<GameId, number>;

export const replyCounts = {
  genshin: 21121,
  starRail: 13436,
  zenless: 8154,
  arknights: 8686,
  endfield: 22851,
  wutheringWaves: 27781,
} satisfies Record<GameId, number>;

export const uniqueAccounts = 1729;
export const formatNumber = (n: number) => n.toLocaleString('zh-CN');
