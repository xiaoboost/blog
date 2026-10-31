import type { topics } from '../content-analysis/constants';

export interface ReviewRow {
  topic: typeof topics[number];
  positive: number;
  negative: number;
  mixed: number;
  neutral: number;
}
