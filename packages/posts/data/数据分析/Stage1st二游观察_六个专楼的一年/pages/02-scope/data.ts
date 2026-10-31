import { games, type GameId } from '../data';

const threadIds = {
  genshin: 2194776,
  starRail: 2170568,
  zenless: 2068301,
  arknights: 2260400,
  endfield: 2265954,
  wutheringWaves: 2059881,
} satisfies Record<GameId, number>;

export const threads = games.map(({ id, name }) => ({ id, name, tid: threadIds[id] }));

export const observation = {
  start: '2025-10-28T00:00:00+08:00',
  lastDay: '2026-10-27T00:00:00+08:00',
  collectedAt: '2026-10-29T01:07:18+08:00',
  days: 365,
  timeZone: 'Asia/Shanghai',
};

export const formatDate = (date: string) => new Intl.DateTimeFormat('zh-CN', {
  timeZone: observation.timeZone, year: 'numeric', month: 'long', day: 'numeric',
}).format(new Date(date));
