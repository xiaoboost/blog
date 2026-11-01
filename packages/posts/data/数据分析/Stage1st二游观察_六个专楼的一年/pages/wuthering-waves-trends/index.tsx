import { YearlyTrends } from '../../components/yearly-trends';
import { series } from './data';

export function WutheringWavesTrends() {
  return <YearlyTrends series={series} />;
}
