import type { ParticipationPanel } from '../../components/participation/types';

export const panels = [
  { gameId: 'arknights' },
  { gameId: 'endfield' },
  { gameId: 'wutheringWaves' },
] as const satisfies readonly ParticipationPanel[];
