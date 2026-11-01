import { YearlyTrends } from '../../components/yearly-trends';
import { series } from './data';

export function StarRailTrends() {
  return <YearlyTrends series={series} />;
}
