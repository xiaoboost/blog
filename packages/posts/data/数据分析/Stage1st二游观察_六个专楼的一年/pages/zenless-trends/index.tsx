import { YearlyTrends } from '../../components/yearly-trends';
import { series } from './data';

export function ZenlessTrends() {
  return <YearlyTrends series={series} />;
}
