import type { GameId } from '../../pages/data';

export interface MatrixColumn {
  id: GameId | 'overall';
  denominator: number;
  counts: readonly number[];
}
