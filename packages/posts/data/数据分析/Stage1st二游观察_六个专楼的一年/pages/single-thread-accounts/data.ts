import { games, type GameId } from '../data';

// Frozen UID aggregates: draft/二游论坛观察/materials/data/single-thread-accounts.json.
// Threshold applies to total replies across all six threads, before selecting
// the denominator for each game. Any reply elsewhere disqualifies exclusivity.
const counts: Record<GameId, [number, number, number, number]> = {
  genshin: [89, 272, 43, 209],
  starRail: [114, 346, 43, 250],
  zenless: [64, 278, 21, 220],
  arknights: [107, 361, 29, 248],
  endfield: [350, 812, 82, 499],
  wutheringWaves: [360, 607, 138, 361],
};

export function accountRows(active: boolean) {
  return games.map(game => ({
    ...game,
    single: counts[game.id][active ? 2 : 0],
    eligible: counts[game.id][active ? 3 : 1],
  })).sort((a, b) => b.single - a.single);
}

export type AccountRow = ReturnType<typeof accountRows>[number];
