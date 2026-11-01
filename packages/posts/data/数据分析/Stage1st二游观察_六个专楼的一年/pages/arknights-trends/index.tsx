import { YearlyTrends } from '../../components/yearly-trends';
import { series } from './data';

export function ArknightsTrends() {
  return <YearlyTrends series={series} />;
}
