import { YearlyTrends } from '../../components/yearly-trends';
import { series } from './data';

export function EndfieldTrends() {
  return <YearlyTrends series={series} />;
}
