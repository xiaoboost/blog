import type { GameId } from '../../pages/data';

export interface ParticipationStage {
  label: string;
  shortLabel: string;
  start: string;
  endExclusive: string;
  partial: boolean;
  baseline: boolean;
  authors: number;
  first: number;
  continued: number;
  returning: number;
  followup: {
    status: 'complete';
    start: string;
    endExclusive: string;
    returned: number;
    absent: number;
  } | {
    status: 'unknown_version_end' | 'insufficient_followup';
  };
}

export interface ParticipationPanel {
  gameId: GameId;
}

export type ParticipationMode = 'composition' | 'followup';
