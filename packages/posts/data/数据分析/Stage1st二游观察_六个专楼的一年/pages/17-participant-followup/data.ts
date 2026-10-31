import type { ParticipationPanel } from '../../components/participation/types';

export const panels = [
  { gameId: 'genshin' },
  { gameId: 'starRail' },
  { gameId: 'zenless' },
] as const satisfies readonly ParticipationPanel[];
