import { games, type GameId } from '../../pages/data';

export interface TrendEvent {
  date: string;
  title: string;
  id: string;
  kind: string;
  sources: string[];
}

export interface TrendStage {
  label: string;
  shortLabel: string;
  start: string;
  endExclusive: string;
  partial: boolean;
  prerelease: boolean;
  days: number;
  replies: number;
  dailyMean: number;
  accounts: number;
}

export interface TrendAnnotation {
  date: string;
  label: string;
  dx: number;
  dy: number;
}

export interface TrendSeries {
  gameId: GameId;
  daily: number[];
  events: TrendEvent[];
  stages: TrendStage[];
  annotations: TrendAnnotation[];
  stageKind: 'version' | 'story_phase' | 'version_with_prerelease';
}

export const observationStart = '2025-10-28';
export const observationEnd = '2026-10-27';
export const dayCount = 365;
const dayMilliseconds = 24 * 60 * 60 * 1000;
export const dayIndex = (date: string) => (Date.parse(`${date}T00:00:00+08:00`) - Date.parse(`${observationStart}T00:00:00+08:00`)) / dayMilliseconds;

export const monthTicks = [
  ['2025-11-01', '2025.11'], ['2025-12-01', '12月'], ['2026-01-01', '2026.01'],
  ['2026-02-01', '2月'], ['2026-03-01', '3月'], ['2026-04-01', '4月'],
  ['2026-05-01', '5月'], ['2026-06-01', '6月'], ['2026-07-01', '7月'],
  ['2026-08-01', '8月'], ['2026-09-01', '9月'], ['2026-10-01', '10月'],
].map(([date, label]) => ({ day: dayIndex(date), label }));

export const yMaximum = 500;
export const yTicks = [0, 100, 200, 300, 400, 500];
export const stageMeanColor = '#bd7b35';

export function prepareSeries(series: TrendSeries) {
  const game = games.find(game => game.id === series.gameId)!;
  let sum = 0;
  const points = series.daily.map((replies, day) => {
    sum += replies;
    if (day >= 7) sum -= series.daily[day - 7];
    // Same trailing mean as the research charts; the first six days use available days.
    return { day, replies, average: sum / Math.min(day + 1, 7) };
  });
  const eventDates = [...new Set(series.events.map(event => event.date))].sort().map(date => ({
    date,
    day: dayIndex(date),
    replies: series.daily[dayIndex(date)],
    events: series.events.filter(event => event.date === date),
  }));
  return { ...game, ...series, points, eventDates };
}
